import type { Awaitable } from "@rsc-utils/type-utils";
import { isPromise } from "node:util/types";
import { warn } from "../../console/index.js";

/**
 * Uses asynchronous logic to perform a find on an array.
 * Exceptions in the predicate will be sent to console.warn and considered "falsey".
 */
export async function findAsync
		<T>
		(array: T[], predicate: (value: T, index: number, array: T[]) => Awaitable<unknown>, thisArg?: any)
		: Promise<T | undefined>;

/**
 * Uses asynchronous logic to filter an array.
 * Exceptions in the predicate will be sent to core-utils::warn and considered "falsey".
 */
export async function findAsync
		<T extends Array<U>, U>
		(array: T, predicate: (value: U, index: number, array: T) => Awaitable<unknown>, thisArg?: any)
		: Promise<U | undefined>;

export async function findAsync
		(array: any[], predicate: (value: any, index: number, values: any[]) => Awaitable<unknown>, thisArg?: any)
		: Promise<any> {
	for (let index = 0, len = array.length; index < len; index++) {
		const item = array[index];
		try {
			const promise = predicate.call(thisArg, item, index, array);
			const result = isPromise(promise)
				? await promise.catch((err: any) => warn(err instanceof Error ? err : new Error(err)))
				: promise;
			if (result) {
				return item;
			}
		}catch(ex) {
			warn(ex instanceof Error ? ex : new Error(ex as string));
		}
	}
	return undefined;
}
