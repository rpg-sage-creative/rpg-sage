import { warn } from "@rsc-utils/console-utils";
import type { Awaitable } from "@rsc-utils/type-utils";
import { isPromise } from "util/types";

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

export async function mapAsync
		(array: any[], callbackfn: (value: any, index: number, array: any[]) => Awaitable<any>, thisArg?: any)
		: Promise<any[]> {
	const arrayConstructor = array.constructor as ArrayConstructor;
	const mapped = new arrayConstructor() as any[];
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
	}
	return mapped;
}
