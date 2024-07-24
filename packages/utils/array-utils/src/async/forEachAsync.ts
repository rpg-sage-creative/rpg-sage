import { warn, type Awaitable } from "@rsc-utils/core-utils";
import { isPromise } from "util/types";

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

export async function forEachAsync
		(array: any[], callbackfn: (value: any, index: number, array: any[]) => Awaitable<void>, thisArg?: any)
		: Promise<void> {
	for (let index = 0, len = array.length; index < len; index++) {
		try {
			const awaitable = callbackfn.call(thisArg, array[index], index, array);
			if (isPromise(awaitable)) {
				await awaitable.catch((err: any) => warn(err instanceof Error ? err : new Error(err)));
			}
		}catch(ex) {
			warn(ex instanceof Error ? ex : new Error(ex as string));
		}
	}
}