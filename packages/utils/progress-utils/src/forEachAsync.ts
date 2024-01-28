import { warn } from "@rsc-utils/console-utils";
import type { Awaitable } from "@rsc-utils/type-utils";
import { isPromise } from "util/types";
import { PercentLogger } from "./PercentLogger.js";

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