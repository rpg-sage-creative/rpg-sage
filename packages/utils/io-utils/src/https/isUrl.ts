import type { Optional } from "@rsc-utils/core-utils";
import type { ESCAPED_URL, VALID_URL } from "./types.js";

/** Returns true if the value starts with http:// or https:// and allows for <> brackets */
export function isUrl(value: Optional<string>): value is VALID_URL | ESCAPED_URL {
	if (value) {
		return value.match(/^https?:\/\/|^<https?:\/\/.*?>$/i) !== null;
	}
	return false;
}
