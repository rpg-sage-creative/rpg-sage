import type { Optional } from "@rsc-utils/type-utils";

/** Returns true if null, undefined, or only whitespace. */
export function isBlank(value: Optional<string>): value is Optional<""> {
	return !value?.trim().length;
}
