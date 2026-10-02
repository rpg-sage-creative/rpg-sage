import type { Awaitable } from "@rsc-utils/type-utils";
import { isPromise } from "node:util/types";
import { warn } from "../../console/index.js";
import { PercentLogger } from "../../progress/PercentLogger.js";

/**
 * Uses asynchronous logic to iterate over an array in order.
 * Exceptions in the callback will be sent to console.warn.
 */
export async function forBatchAsync
		<T>
		(array: T[], batchSize: number, callbackfn: (values: T[], startIndex: number, array: T[]) => Awaitable<void>, thisArg?: any)
		: Promise<void>;

/**
 * Uses asynchronous logic to iterate over an array in order.
 * Exceptions in the callback will be sent to console.warn.
 */
export async function forBatchAsync
		<T extends Array<U>, U>
		(array: T, batchSize: number, callbackfn: (values: U[], startIndex: number, array: T) => Awaitable<void>, thisArg?: any)
		: Promise<void>;

/**
 * Uses asynchronous logic to iterate over an array and log the progress.
 * Exceptions in the callback will be sent to console.warn.
 * Uses default ProgressLogger interval.
 */
export async function forBatchAsync
		<T>
		(label: string, array: T[], batchSize: number, callbackfn: (values: T[], startIndex: number, array: T[]) => Awaitable<void>, thisArg?: any)
		: Promise<void>;

/**
 * Uses asynchronous logic to iterate over an array and log the progress.
 * Exceptions in the callback will be sent to console.warn.
 */
export async function forBatchAsync
		<T>
		(label: string, array: T[], batchSize: number, callbackfn: (values: T[], startIndex: number, array: T[]) => Awaitable<void>, interval?: number, thisArg?: any)
		: Promise<void>;

/**
 * Uses asynchronous logic to iterate over an array and log the progress.
 * Exceptions in the callback will be sent to console.warn.
 * Uses default ProgressLogger interval.
 */
export async function forBatchAsync
		<T extends Array<U>, U>
		(label: string, array: T, batchSize: number, callbackfn: (values: U[], startIndex: number, array: T[]) => Awaitable<void>, thisArg?: any)
		: Promise<void>;


/**
 * Uses asynchronous logic to iterate over an array and log the progress.
 * Exceptions in the callback will be sent to console.warn.
 */
export async function forBatchAsync
		<T extends Array<U>, U>
		(label: string, array: T, batchSize: number, callbackfn: (values: U[], startIndex: number, array: T[]) => Awaitable<void>, interval?: number, thisArg?: any)
		: Promise<void>;

export async function forBatchAsync(...args: any): Promise<void> {
	const label = typeof(args[0]) === "string" ? args.shift() : undefined;

	const array = Array.isArray(args[0]) ? args.shift() : undefined;
	if (!array) {
		throw new RangeError("forBatchAsync requires an array");
	}

	const batchSize = typeof(args[0]) === "number" ? args.shift() : undefined;
	if (!batchSize) {
		throw new RangeError("forBatchAsync requires a batchSize");
	}

	const callbackfn = typeof(args[0]) === "function" ? args.shift() : undefined;
	if (!callbackfn) {
		throw new RangeError("forBatchAsync requires a callbackfn");
	}

	const interval = typeof(args[0]) === "number" ? args.shift() : undefined;
	const thisArg = args[0];

	const pLogger = label ? new PercentLogger(label, array.length, interval) : undefined;

	// trigger the 0% before processing the first item
	pLogger?.start();

	let startIndex = 0;
	let batchLength = 0;
	do {
		const batch = array.slice(startIndex, startIndex + batchSize);
		batchLength = batch.length;
		if (batchLength) {
			try {
				const awaitable = callbackfn.call(thisArg, batch, startIndex, array);
				if (isPromise(awaitable)) {
					await awaitable.catch((err: any) => warn(err instanceof Error ? err : new Error(err)));
				}
			}catch(ex) {
				warn(ex instanceof Error ? ex : new Error(ex as string));
			}
			batch.forEach(() => pLogger?.increment());
			startIndex += batchLength;
		}
	}while (startIndex < array.length && batchLength);

	pLogger?.finish(true);
}