/**
 * Removes the values that return a truthy value from the predicate, in place.
 * Returns the removed values in original order, including null and undefined entries.
 */
export function remove<T>(array: T[], predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): T[] {
	// test each value against the predicate and store the index of those that are truthy
	const indexes: number[] = [];
	array.forEach((value, index, obj) => {
		if (predicate.call(thisArg, value, index, obj)) {
			indexes.push(index);
		}
	});

	// reduceRight allows each splice to not affect the next
	return indexes.reduceRight((removed, indexToRemove, removedIndex) => {
		removed[removedIndex] = array.splice(indexToRemove, 1)[0];
		return removed;
	}, [] as T[]);
}
