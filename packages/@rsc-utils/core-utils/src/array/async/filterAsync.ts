import type { Awaitable } from "@rsc-utils/type-utils";
import { isPromise } from "node:util/types";
import { warn } from "../../console/index.js";

/**
 * Uses asynchronous logic to filter an array.
 * Exceptions in the predicate will be sent to core-utils::warn and considered "falsey".
 */
export async function filterAsync
		<T>
		(array: T[], predicate: (value: T, index: number, array: T[]) => Awaitable<unknown>, thisArg?: any)
		: Promise<T[]>;

/**
 * Uses asynchronous logic to filter an array.
 * Exceptions in the predicate will be sent to core-utils::warn and considered "falsey".
 */
export async function filterAsync
		<T extends Array<U>, U>
		(array: T, predicate: (value: U, index: number, array: T) => Awaitable<unknown>, thisArg?: any)
		: Promise<T>;

export async function filterAsync
		(array: any, predicate: (value: any, index: number, array: any[]) => Awaitable<unknown>, thisArg?: any)
		: Promise<any[]> {
	const constructor = array.constructor as ArrayConstructor;
	const filtered = new constructor() as any[];
	for (let index = 0, len = array.length; index < len; index++) {
		const item = array[index];
		try {
			const awaitable = predicate.call(thisArg, item, index, array);
			const result = isPromise(awaitable)
				? await awaitable.catch((err: any) => warn(err instanceof Error ? err : new Error(err)))
				: awaitable;
			if (result) {
				filtered.push(item);
			}
		}catch(ex) {
			warn(ex instanceof Error ? ex : new Error(ex as string));
		}
	}
	return filtered;
}
