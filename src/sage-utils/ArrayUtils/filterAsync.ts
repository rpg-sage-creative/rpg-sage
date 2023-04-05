
/**
 * Uses asynchronous logic to filter an array.
 * Exceptions in the predicate will be sent to console.warn and considered "falsey".
 */
export async function filterAsync<T>(array: Array<T>, predicate: (value: T, index: number, array: Array<T>) => Promise<unknown>, thisArg?: any): Promise<Array<T>>;

/**
 * Uses asynchronous logic to filter an array.
 * Exceptions in the predicate will be sent to console.warn and considered "falsey".
 */
export async function filterAsync<T, U extends ArrayLike<T>>(arrayLike: U, predicate: (value: T, index: number, arrayLike: U) => Promise<unknown>, thisArg?: any): Promise<U>;

export async function filterAsync<T>(arrayLike: Array<T> | ArrayLike<T>, predicate: (value: T, index: number, arrayLike: Array<T>) => Promise<unknown>, thisArg?: any): Promise<Array<T> | ArrayLike<T>> {
	// Use the same type of ArrayLike we are given for the output.
	// Use Array if it isn't a proper constructable class or we are given null/undefined.
	const constructor = arrayLike?.constructor as ArrayConstructor ?? Array;
	const output: Array<T> = new constructor();

	// Get the length of the ArrayLike.
	// (but do it conditionally in case we were given null/undefined)
	const length = arrayLike?.length ?? 0;

	for (let index = 0; index < length; index++) {
		// Grab the item once to avoid extra processing.
		// (in case this ArrayLike is doing something funky with getters)
		const item = arrayLike[index];

		/** @todo consider having an optional error callback function? */
		const result = await predicate.call(thisArg, item, index, arrayLike as Array<T>)
			.catch((err: any) => console.warn(err instanceof Error ? err : new Error(err)));

		// We only want items if the result is "truthy"
		if (result) {
			output.push(item);
		}
	}
	return output;
}

