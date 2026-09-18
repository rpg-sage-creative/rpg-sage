import { isDefined, type Optional } from "@rsc-utils/type-utils";

/**
 * Filter that reduces an array to unique/defined values.
 * Keeps only values that are !null && !undefined.
 * Keeps only the first instance of a given value.
 */
export function toUniqueDefined<T>(value: Optional<T> | void, index: number, array: (Optional<T> | void)[]): value is T {
	return isDefined(value) && array.indexOf(value) === index;
}