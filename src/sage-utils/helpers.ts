import type { Optional } from "./types";

/** Returns true if the object is NULL or UNDEFINED. */
export function isNullOrUndefined<T>(value: Optional<T>): value is null | undefined {
	return value === null || value === undefined;
}

/** Convenience for !isNullOrUndefined(value) */
export function isDefined<T>(value: Optional<T> | void): value is T {
	return value !== null && value !== undefined;
}
