import type { Optional } from "@rsc-utils/core-utils";

/** Returns true if null, undefined, or only whitespace. */
export function isBlank(text: Optional<string>): text is null | undefined | "" {
	return text === null || text === undefined || text.trim() === "";
}
