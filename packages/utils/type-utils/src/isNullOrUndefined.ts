import type { Optional } from "./generics.js";

/** Returns true if the object is NULL or UNDEFINED. */
export function isNullOrUndefined<T>(value: Optional<T>): value is null | undefined {
	return value === null || value === undefined;
}
