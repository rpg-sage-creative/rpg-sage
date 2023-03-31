import type { Optional } from "..";

/** Returns true if null, undefined, or only whitespace. */
export function isBlank(text: Optional<string>): text is null | undefined | "" {
	return text === null || text === undefined || text.trim() === "";
}

/** Returns true if not null and not undefined and not only whitespace. */
export function isNotBlank(text: Optional<string>): text is string {
	return !isBlank(text);
}
