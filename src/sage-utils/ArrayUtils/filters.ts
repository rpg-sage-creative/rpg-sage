import { isDefined, type Optional } from "..";

/** Convenience filter method for array.filter(isDefined).filter(isUnique) */
export function isDefinedAndUnique<T>(object: Optional<T>, index: number, array: (Optional<T>)[]): object is T {
	return isDefined(object) && isUnique(object, index, array);
}

/** Reusable filter method to ensure array items are unique */
export function isUnique<T>(object: T, index: number, array: T[]): boolean {
	return array.indexOf(object) === index;
}
