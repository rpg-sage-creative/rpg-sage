import type { LoggerLike } from "@rsc-utils/logger-utils";

const ProgressTrackerEventNames = ["error", "finished", "increment", "started", "status"] as const;
export type ProgressTrackerEventName = typeof ProgressTrackerEventNames[number];

export type ProgressTrackerEventData<EventName extends ProgressTrackerEventName> = {
	eventName: EventName;
	tracker: ProgressTracker;
	message: string;
};

type ProgressTrackerEventHandler<EventName extends ProgressTrackerEventName> = (eventData: ProgressTrackerEventData<EventName>) => unknown;

type ProgressTrackerEventHandlers = {
	error?: ProgressTrackerEventHandler<"error">;
	finished?: ProgressTrackerEventHandler<"finished">;
	increment?: ProgressTrackerEventHandler<"increment">;
	started?: ProgressTrackerEventHandler<"started">;
	status?: ProgressTrackerEventHandler<"status">;
};

type ProgressTrackerOptions = {
	/** If true then only the message is reported to event handlers. */
	compact?: boolean;
	/** The percentage interval at which to report progress, between 0-100 (1-99); default 10 */
	interval?: number;
	/** The label that distinguishes this tracker from other trackers. */
	label: string;
	/** A logger to report progress to instead of bespoke handlers. */
	logger?: LoggerLike;
	/** Total count of items to track progress of. */
	total?: number;
	/** If true then increment events are sent to logger.trace() */
	verbose?: boolean;
};

type WithEventOptions = ProgressTrackerOptions & ProgressTrackerEventHandlers;

export type WithLoggerOptions = ProgressTrackerOptions & {
	/** A logger to report progress to instead of bespoke handlers. */
	logger: Partial<LoggerLike>;
};

/**
 * A class for tracking percentage completion of a task.
 */
export class ProgressTracker {
	public countComplete = 0;
	/** The percentage interval at which to report progress, between 0-100 (1-99); default 10 */
	public interval = 10;
	/** The label that distinguishes this tracker from other trackers. */
	public label: string;
	/** The last interval that was reported. */
	public lastInterval = 0;
	/** A logger to report progress to instead of bespoke handlers. */
	public logger?: Partial<LoggerLike>;
	/** Current completion percentage (as integer: 0-100) */
	public percentComplete = 0;
	/** Has the tracker been started: .start() or .increment() was called. */
	public started = false;
	/** Has the tracker finished: .finish() was called. */
	public finished = false;
	/** Total count of items to track progress of. */
	public total = 0;
	/** If true, the entire eventData is sent to logger functions (along with message). */
	public compact = false;
	/** If true, the increment events are sent to logger.debug */
	public verbose = false;

	protected handlers = new Map<ProgressTrackerEventName, Set<ProgressTrackerEventHandler<any>>>();
	public on<EventName extends ProgressTrackerEventName>(eventName: EventName, handler: ProgressTrackerEventHandler<EventName>): this {
		if (!this.handlers.has(eventName)) {
			this.handlers.set(eventName, new Set());
		}
		this.handlers.get(eventName)!.add(handler);
		return this;
	}
	private handle<EventName extends ProgressTrackerEventName>(eventName: EventName, message: string): void {
		const eventData = { eventName, tracker:this, message };

		// call bespoke handlers
		const handlers = this.handlers.get(eventName);
		handlers?.forEach(handler => handler(eventData));

		// call logger function if we have one
		const loggerFnName = eventName === "error" ? "error" : eventName !== "increment" ? "info" : undefined;
		const loggerFn = this.logger?.[loggerFnName as keyof LoggerLike];
		if (loggerFn) {
			this.compact ? loggerFn(message) : loggerFn(this.toLoggerObject(), message);
		}
	}

	public get totalWithCommas(): string {
		return new Intl.NumberFormat("en-US").format(this.total);
	}

	public constructor(label: string, total?: number, interval?: number);
	public constructor(options: ProgressTrackerOptions);
	public constructor(labelOrOptions: string | ProgressTrackerOptions, totalOrUndefined?: number, intervalOrUndefined?: number) {
		if (typeof(labelOrOptions) === "string") {

			this.label = labelOrOptions;
			if (totalOrUndefined! > 0) {
				this.total = totalOrUndefined!;
			}
			if (intervalOrUndefined! > 0) {
				this.interval = intervalOrUndefined!;
			}

		}else {

			// set properties
			const { compact, interval, label, logger, total, verbose } = labelOrOptions;
			if (compact) {
				this.compact = true;
			}
			if (interval! > 0) {
				this.interval = interval!;
			}
			this.label = label;
			if (logger) {
				this.logger = logger;
			}
			if (total! > 0) {
				this.total = total!;
			}
			if (verbose) {
				this.verbose = true;
			}

		}
	}

	/**
	 * Starts the tracker if the existing (or given) total is greater than 0.
	 * If started, reports 0% complete.
	 */
	public start(total?: number): void {
		if (this.finished) {
			this.handle("error", `${this.label} Start Failed: Already Finished!`);

		}else if (this.started) {
			this.handle("error", `${this.label} Start Failed: Already Started!`);

		}else {
			if (total !== undefined) {
				this.total = total;
			}
			if (this.total > 0) {
				this.started = true;
				this.handle("started", `${this.label} Started.`);
				this.status({ force0:true });
			}
			if (!this.started) {
				this.handle("error", `${this.label} Start Failed: Invalid Total (${this.totalWithCommas})`);
			}
		}
	}

	/**
	 * Increments the counter (by 1 if count not given).
	 * Attempts to start (if not already).
	 * If started, calculates percent complete and reports if different than last interval.
	 */
	public increment(count = 1): void {
		if (this.finished) {
			this.handle("error", `${this.label} Increment Failed: Already Finished!`);
		}else {
			if (!this.started) {
				this.start();
			}
			this.handle("increment", `${this.label} increment(${count}); ${this.countComplete} -> ${this.countComplete + 1}`);
			this.countComplete += count;
			if (this.started && !this.finished) {
				this.percentComplete = Math.floor(100 * this.countComplete / this.total);
				if (this.percentComplete % this.interval === 0 && this.percentComplete !== this.lastInterval) {
					this.status();
					this.lastInterval = this.percentComplete;
				}
			}
		}
	}

	/**
	 * Reports the current percent complete.
	 * Only *IF* this tracker was successfully started.
	 */
	public status(): void;

	/** @internal */
	public status(options: { force0?:boolean, force100?:boolean }): void;

	public status(options?: { force0?:boolean, force100?:boolean }): void {
		if (!this.started) {
			this.handle("status", `${this.label} status ... Not Started!`);

		}else if (this.finished) {
			this.handle("status", `${this.label} status ... Finished!`);

		}else {
			let percentComplete = this.percentComplete;
			if (options?.force0) {
				percentComplete = 0;
			}else if (options?.force100) {
				percentComplete = 100;
			}
			this.handle("status", `${this.label} (${this.totalWithCommas}) ... ${percentComplete}%`);
		}
	}

	/**
	 * Reports an error.
	 * Only *IF* this tracker was successfully started.
	 */
	public error(message?: string): void {
		const msg = message
			? `Error: ${message}`
			: `Error!`;
		this.handle("error", `${this.label} (${this.totalWithCommas}) ... Error: ${msg}`);
	}

	/**
	 * Reports one last percentage marker.
	 * Only *IF* this tracker was successfully started.
	 * Only *IF* the last interval reported wasn't 100 (to avoid double reporting 100%).
	 * force100 allows you to force the final output to report 100%
	 */
	public finish(force100 = false): void {
		if (!this.started) {
			this.handle("error", `${this.label} Finish Failed: Not Started!`);

		}else if (this.finished) {
			this.handle("error", `${this.label} Finish Failed: Already Finished!`);

		}else {
			if (this.lastInterval !== 100) {
				this.status({force100});
			}
			this.finished = true;
			this.handle("finished", `${this.label} Finished.`);
		}
	}

	private toLoggerObject() {
		const { countComplete, finished, interval, label, percentComplete, started, total } = this;
		return { countComplete, finished, interval, label, percentComplete, started, total };
	}

	/** Creates a ProgressTracker with all the given events wired up. */
	public static withEvents(options: WithEventOptions): ProgressTracker {
		const tracker = new ProgressTracker(options);

		// add event handlers
		ProgressTrackerEventNames.forEach(eventName => {
			if (typeof(options[eventName]) === "function") {
				tracker.on(eventName, options[eventName] as ProgressTrackerEventHandler<ProgressTrackerEventName>);
			}
		});

		return tracker;
	}

	/** Creates a simple ProgressTracker that reports "status" events to logger.trace() and "error" events to logger.error() */
	public static withLogger(options: WithLoggerOptions): ProgressTracker {
		return new ProgressTracker(options);
	}

}