
/**
 * Uses asynchronous functions to map an array in order.
 * Exceptions in the callback will be sent to console.warn and returned as void.
 */
export async function mapAsync<T, U>(array: Array<T>, callbackfn: (value: T, index: number, array: Array<T>) => Promise<U>, thisArg?: any): Promise<Array<U | void>>;

/**
 * Uses asynchronous functions to map an array in order.
 * Exceptions in the callback will be sent to console.warn and returned as void.
 */
export async function mapAsync<T, U, V = ArrayLike<T>, W = ArrayLike<U | void>>(arrayLike: V, callbackfn: (value: T, index: number, arrayLike: V) => Promise<U>, thisArg?: any): Promise<W>;

export async function mapAsync<T, U>(arrayLike: Array<T> | ArrayLike<T>, callbackfn: (value: T, index: number, arrayLike: Array<T>) => Promise<U>, thisArg?: any): Promise<Array<U> | ArrayLike<U>> {
	// Use the same type of ArrayLike we are given for the output.
	// Use Array if it isn't a proper constructable class or we are given null/undefined.
	const constructor = arrayLike?.constructor as ArrayConstructor ?? Array;
	const output: Array<U> = new constructor();

	// Get the length of the ArrayLike.
	// (but do it conditionally in case we were given null/undefined)
	const length = arrayLike?.length ?? 0;

	for (let index = 0; index < length; index++) {
		let hasError = false;
		const promise = callbackfn.call(thisArg, arrayLike[index], index, arrayLike as Array<T>);
		const value = await promise.catch((err: any) => {
			hasError = true;
			console.warn(err instanceof Error ? err : new Error(err));
		});

		// We only want items that didn't cause an error
		if (!hasError) {
			// By setting values via index, we are leaving the indexes with errors uninitialized/void.
			output[index] = value as U;
		}
	}
	return output;
}
