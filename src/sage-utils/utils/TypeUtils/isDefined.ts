import type { Optional } from "./types";

/** Convenience for !isNullOrUndefined(value) */
export function isDefined<T>(value: Optional<T> | void): value is T {
	return value !== null && value !== undefined;
}
