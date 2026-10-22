import type { LoggerLike } from "@rsc-utils/logger-utils";
import { ProgressTracker, type WithLoggerOptions } from "./ProgressTracker.js";

// function toError(err: unknown): Error {
// 	return err instanceof Error ? err : new Error(err as string);
// }

type IterableLike<T> = ArrayLike<T> | Set<T>;

export class ProgressIterator<T> {

	protected _loggerOptions?: WithLoggerOptions;
	protected _logger?: LoggerLike;
	protected _tracker?: ProgressTracker;
	public get tracker(): ProgressTracker | undefined {
		if (!this._tracker) {
			if (this._logger) {
				this._tracker = ProgressTracker.withLogger({
					label: "ProgressIterator.forEach",
					logger: this._logger,
					total: this.array.length,
				});

			}else if (this._loggerOptions) {
				this._tracker = ProgressTracker.withLogger({
					compact: this._loggerOptions.compact,
					interval: this._loggerOptions.interval,
					label: this._loggerOptions.label ?? "ProgressIterator.forEach",
					logger: this._loggerOptions.logger,
					total: this.array.length,
					verbose: this._loggerOptions.verbose,
				});
			}
		}
		return this._tracker;
	}

	protected array: T[];
	public constructor(iterable: IterableLike<T>) {
		this.array = Array.from(iterable);
	}

	public forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void {
		const { array, tracker } = this;
		tracker?.start();
		for (let index = 0, len = array.length; index < len; index++) {
			callbackfn.call(thisArg, array[index], index, array);
			tracker?.increment();
		}
		tracker?.finish();
	}

	public async forEachAsync(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): Promise<void> {
		const { array, tracker } = this;
		tracker?.start();
		for (let index = 0, len = array.length; index < len; index++) {
			await callbackfn.call(thisArg, array[index], index, array);
			tracker?.increment();
		}
		tracker?.finish();
	}

	public map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[] {
		const { array, tracker } = this;
		tracker?.start();
		const outValues: U[] = [];
		for (let index = 0, len = array.length; index < len; index++) {
			outValues.push(callbackfn.call(thisArg, array[index], index, array));
			tracker?.increment();
		}
		tracker?.finish();
		return outValues;
	}

	public async mapAsync<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): Promise<U[]> {
		const { array, tracker } = this;
		tracker?.start();
		const outValues: U[] = [];
		for (let index = 0, len = array.length; index < len; index++) {
			outValues.push(await callbackfn.call(thisArg, array[index], index, array));
			tracker?.increment();
		}
		tracker?.finish();
		return outValues;
	}

	public static withLogger<T>(iterable: IterableLike<T>, logger: LoggerLike): ProgressIterator<T>;
	public static withLogger<T>(iterable: IterableLike<T>, options: WithLoggerOptions): ProgressIterator<T>;
	public static withLogger<T>(iterable: IterableLike<T>, loggerOrOptions: LoggerLike | WithLoggerOptions): ProgressIterator<T> {
		const iterator = new ProgressIterator(iterable);
		if ("logger" in loggerOrOptions) {
			iterator._loggerOptions = loggerOrOptions;
		}else {
			iterator._logger = loggerOrOptions;
		}
		return iterator;
	}

	public static withTracker<T>(iterable: IterableLike<T>, tracker: ProgressTracker): ProgressIterator<T> {
		const iterator = new ProgressIterator(iterable);
		iterator._tracker = tracker;
		return iterator;
	}
}