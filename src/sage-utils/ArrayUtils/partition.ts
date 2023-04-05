
/**
 * Partitions the values into nested Arrays based on the partitionfn.
 */
export function partition<T>(array: Array<T>, partitionfn: (value: T, index: number, array: Array<T>) => number, thisArg?: any): Array<Array<T>>;

/**
 * Partitions the values into nested Arrays based on the partitionfn.
 */
export function partition<T>(arrayLike: ArrayLike<T>, partitionfn: (value: T, index: number, arrayLike: ArrayLike<T>) => number, thisArg?: any): Array<Array<T>>;

export function partition<T>(arrayLike: Array<T> | ArrayLike<T>, partitionfn: (value: T, index: number, arrayLike: Array<T>) => number, thisArg?: any): Array<Array<T>> {
	// We are keeping this simple and only returning an Array of Arrays
	const output: T[][] = [];

	// Get the length of the ArrayLike.
	// (but do it conditionally in case we were given null/undefined)
	const length = arrayLike?.length ?? 0;

	for (let index = 0; index < length; index++) {
		// Grab the item once to avoid extra processing.
		// (in case this ArrayLike is doing something funky with getters)
		const item = arrayLike[index];

		const partIndex = partitionfn.call(thisArg, item, index, arrayLike as Array<T>);
		const part = output[partIndex] ?? (output[partIndex] = []);
		part.push(item);
	}

	return output;
}