import { getUrlRegex } from "./createUrlRegex.js";

/** Returns true if the value tests successfully against the url regex and allows for <> brackets */
export function isUrl(value: string): boolean {
	return getUrlRegex({ anchored:true, wrapChars:"<>", wrapOptional:true }).test(value);
}