
/**
 * Uses asynchronous functions to iterate over an array in order.
 * Exceptions in the callback will be sent to console.warn.
 */
export async function forEachAsync<T>(array: Array<T>, callbackfn: (value: T, newIndex: number, array: Array<T>) => Promise<void>, thisArg?: any): Promise<void>;

/**
 * Uses asynchronous functions to iterate over an array in order.
 * Exceptions in the callback will be sent to console.warn.
 */
export async function forEachAsync<T, U extends ArrayLike<T>>(arrayLike: U, callbackfn: (value: T, newIndex: number, arrayLike: U) => Promise<void>, thisArg?: any): Promise<void>;

export async function forEachAsync<T>(arrayLike: Array<T> | ArrayLike<T>, callbackfn: (value: T, newIndex: number, arrayLike: Array<T>) => Promise<void>, thisArg?: any): Promise<void> {
	// Get the length of the ArrayLike.
	// (but do it conditionally in case we were given null/undefined)
	const length = arrayLike?.length ?? 0;

	for (let index = 0; index < length; index++) {
		await callbackfn.call(thisArg, arrayLike[index], index, arrayLike as Array<T>)
			.catch((err: any) => console.warn(err instanceof Error ? err : new Error(err)));
	}
}
