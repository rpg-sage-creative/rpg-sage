import { warn } from "@rsc-utils/core-utils";
import { isPromise } from "util/types";
import { PercentLogger } from "./PercentLogger.js";

/** Represents an object or a promise to get that object. */
type Awaitable<T> = T | PromiseLike<T>;

/**
 * Uses asynchronous logic to map an array and log the progress.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 * Based on mapAsync from array-utils.
 */
export async function mapAsync
		<T, U>
		(label: string, array: U[], callbackfn: (value: U, index: number, array: U[]) => Awaitable<T>, interval?: number)
		: Promise<T[]>;

/**
 * Uses asynchronous logic to map an array and log the progress.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 * Based on mapAsync from array-utils.
 */
export async function mapAsync
		<T extends Array<U>, U, V extends Array<W>, W>
		(label: string, array: V, callbackfn: (value: W, index: number, array: V) => Awaitable<U>, interval?: number)
		: Promise<V>;

export async function mapAsync
		(label: string, array: any[], callbackfn: (value: any, index: number, array: any[]) => Awaitable<any>, interval?: number)
		: Promise<any[]> {
	const pLogger = new PercentLogger(label, array.length, interval);
	const arrayConstructor = array.constructor as ArrayConstructor;
	const mapped = new arrayConstructor() as any[];
	for (let index = 0, len = array.length; index < len; index++) {
		try {
			const promise = callbackfn(array[index], index, array);
			const result = isPromise(promise)
				? await promise.catch((err: any) => warn(err instanceof Error ? err : new Error(err)))
				: promise;
			mapped.push(result);
		}catch(ex) {
			warn(ex instanceof Error ? ex : new Error(ex as string));
			mapped.push(undefined);
		}
		pLogger.increment();
	}
	return mapped;
}
