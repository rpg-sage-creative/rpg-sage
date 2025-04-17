import { isPromise } from "util/types";
import { warn } from "../../console/index.js";
import type { Awaitable } from "../../types/generics.js";
import { PercentLogger } from "../../progress/PercentLogger.js";

/**
 * Uses asynchronous logic to map an array in order.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 */
export async function mapAsync
		<T, U>
		(array: U[], callbackfn: (value: U, index: number, array: U[]) => Awaitable<T>, thisArg?: any)
		: Promise<T[]>;

/**
 * Uses asynchronous logic to map an array in order.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 */
export async function mapAsync
		<T extends Array<U>, U, V extends Array<W>, W>
		(array: V, callbackfn: (value: W, index: number, array: V) => Awaitable<U>, thisArg?: any)
		: Promise<V>;

/**
 * Uses asynchronous logic to map an array and log the progress.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 */
export async function mapAsync
		<T, U>
		(label: string, array: U[], callbackfn: (value: U, index: number, array: U[]) => Awaitable<T>, thisArg?: any)
		: Promise<T[]>;

/**
 * Uses asynchronous logic to map an array and log the progress.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 */
export async function mapAsync
		<T, U>
		(label: string, array: U[], callbackfn: (value: U, index: number, array: U[]) => Awaitable<T>, interval?: number, thisArg?: any)
		: Promise<T[]>;

/**
 * Uses asynchronous logic to map an array and log the progress.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 */
export async function mapAsync
		<T extends Array<U>, U, V extends Array<W>, W>
		(label: string, array: V, callbackfn: (value: W, index: number, array: V) => Awaitable<U>, thisArg?: any)
		: Promise<V>;

/**
 * Uses asynchronous logic to map an array and log the progress.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 */
export async function mapAsync
		<T extends Array<U>, U, V extends Array<W>, W>
		(label: string, array: V, callbackfn: (value: W, index: number, array: V) => Awaitable<U>, interval?: number, thisArg?: any)
		: Promise<V>;

export async function mapAsync(...args: any): Promise<any[]> {
	const label = typeof(args[0]) === "string" ? args.shift() : undefined;

	const array = Array.isArray(args[0]) ? args.shift() : undefined;
	if (!array) {
		throw new RangeError("mapAsync requires an array");
	}

	const callbackfn = typeof(args[0]) === "function" ? args.shift() : undefined;
	if (!callbackfn) {
		throw new RangeError("mapAsync requires a callbackfn");
	}

	const interval = typeof(args[0]) === "number" ? args.shift() : undefined;
	const thisArg = args[0];

	const pLogger = label ? new PercentLogger(label, array.length, interval) : undefined;

	// trigger the 0% before processing the first item
	pLogger?.start();

	const arrayConstructor = array.constructor as ArrayConstructor;
	const mapped = new arrayConstructor();
	for (let index = 0, len = array.length; index < len; index++) {
		try {
			const promise = callbackfn.call(thisArg, array[index], index, array);
			const result = isPromise(promise)
				? await promise.catch((err: any) => warn(err instanceof Error ? err : new Error(err)))
				: promise;
			mapped.push(result);
		}catch(ex) {
			warn(ex instanceof Error ? ex : new Error(ex as string));
			mapped.push(undefined);
		}
		pLogger?.increment();
	}
	return mapped;
}
