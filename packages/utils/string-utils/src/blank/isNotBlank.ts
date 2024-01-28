import type { Optional } from "@rsc-utils/type-utils";
import { isBlank } from "./isBlank.js";

/** Returns true if not null and not undefined and not only whitespace. */
export function isNotBlank(text: Optional<string>): text is string {
	return !isBlank(text);
}
