/** Uses asynchronous functions to filter an array. */
export async function filter<T>(array: T[], predicate: (value: T, index: number, array: T[]) => Promise<unknown>, thisArg?: any): Promise<T[]> {
	const filtered: T[] = [];
	for (let index = 0, len = array.length; index < len; index++) {
		const item = array[index];
		const result = await predicate.call(thisArg, item, index, array)
			.catch((err: any) => console.warn(err instanceof Error ? err : new Error(err)));
		if (result) {
			filtered.push(item);
		}
	}
	return filtered;
}

/** Uses asynchronous functions to find an array. Requires a TRUE boolean value, not a "truthy" boolean value. */
export async function find<T>(array: T[], predicate: (value: T, index: number, obj: T[]) => Promise<T>, thisArg?: any): Promise<T | undefined> {
	for (let index = 0, len = array.length; index < len; index++) {
		const item = array[index];
		const result = await predicate.call(thisArg, item, index, array)
			.catch((err: any) => console.warn(err instanceof Error ? err : new Error(err)));
		if (result) {
			return item;
		}
	}
	return undefined;
}

type TForEachIterator<T> = (value: T, index: number, array: T[]) => Promise<void>;

/** Uses asynchronous functions to iterate over an array in order. */
export async function forEach<T>(array: T[], iterator: TForEachIterator<T>, thisArg?: any): Promise<T[]> {
	for (let index = 0, len = array.length; index < len; index++) {
		await iterator.call(thisArg, array[index], index, array)
			.catch((err: any) => console.warn(err instanceof Error ? err : new Error(err)));
	}
	return array;
}

type TMapIterator<T, U> = (value: T, index: number, array: T[]) => Promise<U>;

/** Uses asynchronous functions to map an array in order. */
export async function map<T, U>(array: T[], iterator: TMapIterator<T, U>, thisArg?: any): Promise<(U | undefined)[]> {
	const values = <(U | void)[]>[];
	for (let index = 0, len = array.length; index < len; index++) {
		values[index] = await iterator.call(thisArg, array[index], index, array)
			.catch((err: any) => console.warn(err instanceof Error ? err : new Error(err)));
	}
	return values as (U | undefined)[];
}
