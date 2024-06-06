import type { Optional } from "@rsc-utils/core-utils";
import type { ESCAPED_URL, VALID_URL } from "./types.js";

/** Returns true if the value starts with http:// or https:// and allows for <> brackets */
export function isUrl(value: Optional<string>): value is VALID_URL | ESCAPED_URL {
	return value?.match(/^https?:\/\/|^<https?:\/\/.*?>$/i) !== null;
}

/** Removes any <> brackets from the given url. */
export function cleanUrl(value: VALID_URL | ESCAPED_URL): VALID_URL {
	if (value.startsWith("<") && value.endsWith(">")) {
		return value.slice(1, -1).trim() as VALID_URL;
	}
	return value as VALID_URL;
}
