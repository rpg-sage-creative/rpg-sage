import { warn } from "@rsc-utils/core-utils";
import { isPromise } from "util/types";
import { PercentLogger } from "./PercentLogger.js";

/** Represents an object or a promise to get that object. */
type Awaitable<T> = T | PromiseLike<T>;

/**
 * Uses asynchronous logic to iterate over an array and log the progress.
 * Exceptions in the callback will be sent to console.warn.
 * Based on forEachAsync from async-array-utils.
 */
export async function forEachAsync
		<T>
		(label: string, array: T[], callbackfn: (value: T, index: number, array: T[]) => Awaitable<void>, interval?: number)
		: Promise<void>;

export async function forEachAsync
		(label: string, array: any[], callbackfn: (value: any, index: number, array: any[]) => Awaitable<void>, interval?: number)
		: Promise<void> {
	const pLogger = new PercentLogger(label, array.length, interval);

	// trigger the 0% before processing the first item
	pLogger.start();

	for (let index = 0, len = array.length; index < len; index++) {
		try {
			const awaitable = callbackfn(array[index], index, array);
			if (isPromise(awaitable)) {
				await awaitable.catch((err: any) => warn(err instanceof Error ? err : new Error(err)));
			}
		}catch(ex) {
			warn(ex instanceof Error ? ex : new Error(ex as string));
		}
		pLogger.increment();
	}
}