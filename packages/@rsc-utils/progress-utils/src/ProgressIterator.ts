import type { LoggerLike } from "@rsc-utils/logger-utils";
import { ProgressTracker, type WithLoggerOptions } from "./ProgressTracker.js";

type IterableLike<T> = Array<T> | Set<T>;

export class ProgressIterator<T> {

	protected _tracker?: ProgressTracker;
	public get tracker(): ProgressTracker | undefined {
		if (!this._tracker) {
			if (this._logger) {
				this._tracker = ProgressTracker.withLogger({
					label: "ProgressIterator.forEach",
					logger: this._logger,
					total: "length" in this.iterable ? this.iterable.length : this.iterable.size,
				});

			}else if (this._loggerOptions) {
				this._tracker = ProgressTracker.withLogger({
					compact: this._loggerOptions.compact,
					interval: this._loggerOptions.interval,
					label: this._loggerOptions.label ?? "ProgressIterator.forEach",
					logger: this._loggerOptions.logger,
					total: "length" in this.iterable ? this.iterable.length : this.iterable.size,
				});
			}
		}
		return this._tracker;
	}

	protected _logger?: LoggerLike;
	protected _loggerOptions?: WithLoggerOptions;

	public constructor(public iterable: IterableLike<T>) { }

	public forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void {
		const { iterable, tracker } = this;
		tracker?.start();
		Array.from(iterable).forEach((value, index, array) => {
			callbackfn.call(thisArg, value, index, array);
			tracker?.increment();
		});
	}

	public map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[] {
		const { iterable, tracker } = this;
		tracker?.start();
		return Array.from(iterable).map((value, index, array) => {
			const outValue = callbackfn.call(thisArg, value, index, array);
			tracker?.increment();
			return outValue;
		});
	}

	public static withLogger<T>(iterable: IterableLike<any>, logger: LoggerLike): ProgressIterator<T>;
	public static withLogger<T>(iterable: IterableLike<any>, options: WithLoggerOptions): ProgressIterator<T>;
	public static withLogger<T>(iterable: IterableLike<any>, loggerOrOptions: LoggerLike | WithLoggerOptions): ProgressIterator<T> {
		const iterator = new ProgressIterator(iterable);
		if ("logger" in loggerOrOptions) {
			iterator._loggerOptions = loggerOrOptions;
		}else {
			iterator._logger = loggerOrOptions;
		}
		return iterator;
	}

	public static withTracker<T>(iterable: IterableLike<any>, tracker: ProgressTracker): ProgressIterator<T> {
		const iterator = new ProgressIterator(iterable);
		iterator._tracker = tracker;
		return iterator;
	}
}