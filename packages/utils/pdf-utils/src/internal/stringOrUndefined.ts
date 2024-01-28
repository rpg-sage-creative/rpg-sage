import type { Optional } from "@rsc-utils/type-utils";

/**
 * @internal
 * @private
 * Returns a non-blank string or undefined.
 */
export function stringOrUndefined(value: Optional<string>): string | undefined {
	return value === null || value === undefined || value.trim() === "" ? undefined : value;
}