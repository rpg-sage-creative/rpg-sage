import type { Optional } from "../../types/generics.js";

/** Returns a non-blank string or undefined. */
export function stringOrUndefined(value: Optional<string>): string | undefined {
	return value?.trim().length ? value : undefined;
}