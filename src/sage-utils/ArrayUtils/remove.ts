
/**
 * Removes the values that return a truthy value.
 * All removed values are returned in a new array with the same index they were originally in.
 * (All other indexes are uninitialized and won't be processed by .forEach or .map)
 */
export function remove<T>(array: Array<T>, predicate: (value: T, index: number, obj: Array<T>) => unknown, thisArg?: any): Array<T> {
	const indexes: number[] = [];
	const removed: T[] = [];
	array.forEach((value, index, obj) => {
		if (predicate.call(thisArg, value, index, obj)) {
			// By unshifting, we are putting the indexes in reverse order, so that we can safely splice later
			indexes.unshift(index);

			// By setting values via index, we are maintaining its original index while still creating an array that is easy to traverse.
			removed[index] = value;
		}
	});
	indexes.forEach(index => array.splice(index, 1));
	return removed;
}
