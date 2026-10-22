/**
 * Filter that reduces an array to unique values.
 * Keeps only the first instance of a given value.
 */
export function toUnique<T>(value: T, index: number, array: T[]): boolean {
	return array.indexOf(value) === index;
}