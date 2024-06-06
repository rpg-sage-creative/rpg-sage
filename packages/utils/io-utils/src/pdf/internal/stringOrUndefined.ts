import type { Optional } from "./types.js";

/**
 * @internal
 * Returns a non-blank string or undefined.
 */
export function stringOrUndefined(value: Optional<string>): string | undefined {
	return value === null || value === undefined || value.trim() === "" ? undefined : value;
}