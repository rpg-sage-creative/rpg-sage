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

type ProgressTrackerOptions = ProgressTrackerEventHandlers & {
	total?: number;
	interval?: number;
};

type WithEventOptions = ProgressTrackerOptions & {
	label: string;
};

export type WithLoggerOptions = {
	interval?: number;
	label: string;
	logger: LoggerLike;
	total?: number;
	compact?: boolean;
};

/**
 * A class for tracking percentage completion of a task.
 */
export class ProgressTracker {
	public countComplete = 0;
	/** The percentage interval at which to report progress, between 0-100 (1-99); default 10 */
	public interval = 10;
	public label: string;
	public lastInterval = 0;
	public percentComplete = 0;
	public started = false;
	public finished = false;
	public total = 0;

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
		const handlers = this.handlers.get(eventName);
		handlers?.forEach(handler => handler(eventData));
	}

	public constructor(label: string, total?: number, interval?: number);
	public constructor(label: string, options?: ProgressTrackerOptions);
	public constructor(label: string, optsOrTotal?: number | ProgressTrackerOptions, interval?: number) {
		this.label = label;
		if (optsOrTotal) {
			if (typeof(optsOrTotal) === "number") {
				if (optsOrTotal > 0) {
					this.total = optsOrTotal;
				}
			}else {
				ProgressTrackerEventNames.forEach(eventName => {
					if (typeof(optsOrTotal[eventName]) === "function") {
						this.on(eventName, optsOrTotal[eventName] as ProgressTrackerEventHandler<ProgressTrackerEventName>);
					}
				})
				if (optsOrTotal.interval && optsOrTotal.interval > 0) {
					this.interval = optsOrTotal.interval;
				}
				if (optsOrTotal.total && optsOrTotal.total > 0) {
					this.total = optsOrTotal.total;
				}
			}
		}
		if (typeof(interval) === "number" && interval > 0) {
			this.interval = interval;
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
				this.handle("error", `${this.label} Start Failed: Invalid Total (${this.total})`);
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
			this.handle("increment", `${this.label} increment: count = ${count}`);
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
			this.handle("status", `${this.label} (${this.total}) ... ${percentComplete}%`);
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
		this.handle("error", `${this.label} (${this.total}) ... Error: ${msg}`);
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
		return new ProgressTracker(options.label, options);
	}

	/** Creates a simple ProgressTracker that reports "status" events to logger.trace() and "error" events to logger.error() */
	public static withLogger(label: string, logger: LoggerLike): ProgressTracker;
	public static withLogger(options: WithLoggerOptions): ProgressTracker;
	public static withLogger(labelOrOptions: string | WithLoggerOptions, loggerOrUndefined?: LoggerLike): ProgressTracker {
		let label: string;
		let interval: number | undefined;
		let total: number | undefined;
		let logger: LoggerLike;
		let compact: boolean | undefined = false;
		if (typeof(labelOrOptions) === "string") {
			label = labelOrOptions;
			logger = loggerOrUndefined!;
		}else {
			({ label, interval, total, logger, compact } = labelOrOptions);
		}
		return new ProgressTracker(label, {
			interval,
			total,
			error: compact ? ({ message }) => logger.error(message) : ({ message, tracker }) => logger.error(tracker.toLoggerObject(), message),
			finished: compact ? ({ message }) => logger.info(message) : ({ message, tracker }) => logger.info(tracker.toLoggerObject(), message),
			increment: compact ? ({ message }) => logger.debug(message) : ({ message, tracker }) => logger.debug(tracker.toLoggerObject(), message),
			started: compact ? ({ message }) => logger.info(message) : ({ message, tracker }) => logger.info(tracker.toLoggerObject(), message),
			status: compact ? ({ message }) => logger.trace(message) : ({ message, tracker }) => logger.trace(tracker.toLoggerObject(), message),
		});
	}

}