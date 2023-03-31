import type { Optional } from "..";

/** Reusable filter method to ensure array items exist: o => o !== null && o !== undefined */
export function exists<T>(object: Optional<T>): object is T {
	return object !== undefined && object !== null;
}

/** Convenience filter method for array.filter(exists).filter(unique) */
export function existsAndUnique<T>(object: Optional<T>, index: number, array: (Optional<T>)[]): object is T {
	return exists(object) && unique(object, index, array);
}

/** Reusable filter method to ensure array items are unique */
export function unique<T>(object: T, index: number, array: T[]): boolean {
	return array.indexOf(object) === index;
}
