import type { Awaitable } from "@rsc-utils/type-utils";
import { isPromise } from "node:util/types";
import { warn } from "../../console/index.js";
import { PercentLogger } from "../../progress/PercentLogger.js";

/**
 * Uses asynchronous logic to iterate over an array in order.
 * Exceptions in the callback will be sent to console.warn.
 */
export async function forEachAsync
		<T>
		(array: T[], callbackfn: (value: T, index: number, array: T[]) => Awaitable<void>, thisArg?: any)
		: Promise<void>;

/**
 * Uses asynchronous logic to iterate over an array in order.
 * Exceptions in the callback will be sent to console.warn.
 */
export async function forEachAsync
		<T extends Array<U>, U>
		(array: T, callbackfn: (value: U, index: number, array: T) => Awaitable<void>, thisArg?: any)
		: Promise<void>;

/**
 * Uses asynchronous logic to iterate over an array and log the progress.
 * Exceptions in the callback will be sent to console.warn.
 * Uses default ProgressLogger interval.
 */
export async function forEachAsync
		<T>
		(label: string, array: T[], callbackfn: (value: T, index: number, array: T[]) => Awaitable<void>, thisArg?: any)
		: Promise<void>;

/**
 * Uses asynchronous logic to iterate over an array and log the progress.
 * Exceptions in the callback will be sent to console.warn.
 */
export async function forEachAsync
		<T>
		(label: string, array: T[], callbackfn: (value: T, index: number, array: T[]) => Awaitable<void>, interval?: number, thisArg?: any)
		: Promise<void>;

/**
 * Uses asynchronous logic to iterate over an array and log the progress.
 * Exceptions in the callback will be sent to console.warn.
 * Uses default ProgressLogger interval.
 */
export async function forEachAsync
		<T extends Array<U>, U>
		(label: string, array: T, callbackfn: (value: U, index: number, array: T) => Awaitable<void>, thisArg?: any)
		: Promise<void>;


/**
 * Uses asynchronous logic to iterate over an array and log the progress.
 * Exceptions in the callback will be sent to console.warn.
 */
export async function forEachAsync
		<T extends Array<U>, U>
		(label: string, array: T, callbackfn: (value: U, index: number, array: T) => Awaitable<void>, interval?: number, thisArg?: any)
		: Promise<void>;

export async function forEachAsync(...args: any): Promise<void> {
	const label = typeof(args[0]) === "string" ? args.shift() : undefined;

	const array = Array.isArray(args[0]) ? args.shift() : undefined;
	if (!array) {
		throw new RangeError("forEachAsync requires an array");
	}

	const callbackfn = typeof(args[0]) === "function" ? args.shift() : undefined;
	if (!callbackfn) {
		throw new RangeError("forEachAsync requires a callbackfn");
	}

	const interval = typeof(args[0]) === "number" ? args.shift() : undefined;
	const thisArg = args[0];

	const pLogger = label ? new PercentLogger(label, array.length, interval) : undefined;

	// trigger the 0% before processing the first item
	pLogger?.start();

	for (let index = 0, len = array.length; index < len; index++) {
		try {
			const awaitable = callbackfn.call(thisArg, array[index], index, array);
			if (isPromise(awaitable)) {
				await awaitable.catch((err: any) => warn(err instanceof Error ? err : new Error(err)));
			}
		}catch(ex) {
			warn(ex instanceof Error ? ex : new Error(ex as string));
		}
		pLogger?.increment();
	}
}