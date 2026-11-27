type OrUndefined<T> = T | undefined;

// splice-highest-first comparator — default .sort() is lexicographic and would remove the WRONG indexes across the 10-boundary (indexes are pre-validated integers, so no nullish/±0 handling needed)
const sortIndexesDesc = (a: number, b: number): -1 | 0 | 1 => a < b ? 1 : a > b ? -1 : 0;

/** Remove the value at the given index using .splice(). Negative indexes count from the end and out-of-range is a no-op returning undefined. */
export function removeAt<T>(array: T[], index: number): OrUndefined<T>;

/**
 * Remove the values at the given indexes using .splice(), returning them in the order the indexes were given.
 * Duplicate indexes are removed only once, and negative indexes count from the end like .splice().
 * Non-integer and out-of-range indexes are skipped, so every returned value matches an actual removal.
 */
export function removeAt<T>(array: T[], indexes: number[]): T[];

export function removeAt<T>(values: T[], indexOrIndexes: number | number[]): OrUndefined<T> | T[] {
	if (Array.isArray(indexOrIndexes)) {
		const length = values.length;

		// normalize negative indexes so -1 and length-1 dedupe together, keeping only valid integer indexes
		const unique = new Set<number>();
		for (const index of indexOrIndexes) {
			const normalized = index < 0 ? index + length : index;
			if (Number.isInteger(normalized) && normalized >= 0 && normalized < length) {
				unique.add(normalized);
			}
		}

		// convert set to array
		const ordered = [...unique];

		// map indexes to values
		const removed = ordered.map(index => values[index]);

		// sort indexes for splicing
		ordered.sort(sortIndexesDesc).forEach(index => values.splice(index, 1));

		return removed;
	}

	// splice and return the single given index
	return values.splice(indexOrIndexes, 1)[0];
}
