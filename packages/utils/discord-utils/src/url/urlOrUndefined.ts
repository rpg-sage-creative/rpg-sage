import { unwrap, type Optional } from "@rsc-utils/core-utils";
import { isUrl, type VALID_URL } from "@rsc-utils/io-utils";

/** Checks that the valud is a valid url and returns the unwrapped url (removes <>). */
export function urlOrUndefined(value: Optional<string>): VALID_URL | undefined {
	const bool = isUrl(value, { wrapChars:"<>", wrapOptional:true });
	if (bool) {
		return unwrap(value, "<>") as VALID_URL;
	}
	return undefined;
}
