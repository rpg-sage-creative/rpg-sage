import type { Awaitable } from "@rsc-utils/type-utils";
import { isPromise } from "node:util/types";
import { warn } from "../../console/index.js";
import { PercentLogger } from "../../progress/PercentLogger.js";

/**
 * Uses asynchronous logic to map an array in order.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 */
export async function mapAsync<
		OutValue,
		InValue,
	>(
		array: InValue[],
		callbackfn: (value: InValue, index: number, array: InValue[]) => Awaitable<OutValue>,
		thisArg?: any
	)
		: Promise<OutValue[]>;

/**
 * Uses asynchronous logic to map an array in order.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 */
export async function mapAsync<
		OutArray extends Array<OutValue>,
		OutValue,
		InArray extends Array<InValue>,
		InValue,
	>(
		array: InArray,
		callbackfn: (value: InValue, index: number, array: InArray) => Awaitable<OutValue>,
		thisArg?: any
	)
		: Promise<OutArray>;

/**
 * Uses asynchronous logic to map an array and log the progress.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 */
export async function mapAsync<
		OutValue,
		InValue,
	>(
		label: string,
		array: InValue[],
		callbackfn: (value: InValue, index: number, array: InValue[]) => Awaitable<OutValue>,
		thisArg?: any
	)
		: Promise<OutValue[]>;

/**
 * Uses asynchronous logic to map an array and log the progress.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 */
export async function mapAsync<
		OutValue,
		InValue,
	>(
		label: string,
		array: InValue[],
		callbackfn: (value: InValue, index: number, array: InValue[]) => Awaitable<OutValue>,
		interval?: number,
		thisArg?: any
	)
		: Promise<OutValue[]>;

/**
 * Uses asynchronous logic to map an array and log the progress.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 */
export async function mapAsync<
		OutArray extends Array<OutValue>,
		OutValue,
		InArray extends Array<InValue>,
		InValue,
	>(
		label: string,
		array: InArray,
		callbackfn: (value: InValue, index: number, array: InArray) => Awaitable<OutValue>,
		thisArg?: any
	)
		: Promise<OutArray>;

/**
 * Uses asynchronous logic to map an array and log the progress.
 * Exceptions in the callback will be sent to console.warn and the valued at that index will be undefined.
 */
export async function mapAsync<
		OutArray extends Array<OutValue>,
		OutValue,
		InArray extends Array<InValue>,
		InValue,
	>(
		label: string,
		array: InArray,
		callbackfn: (value: InValue, index: number, array: InArray) => Awaitable<OutValue>,
		interval?: number,
		thisArg?: any
	)
		: Promise<OutArray>;

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
