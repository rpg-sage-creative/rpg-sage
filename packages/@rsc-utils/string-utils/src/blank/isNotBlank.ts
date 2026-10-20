import type { Optional } from "@rsc-utils/type-utils";

/** Returns true if not null and not undefined and not only whitespace. */
export function isNotBlank(value: Optional<string>): value is string {
	return !!value?.trim().length;
}
