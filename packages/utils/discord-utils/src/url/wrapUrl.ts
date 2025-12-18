import { isWrapped, wrap } from "@rsc-utils/core-utils";
import { getUrlRegex } from "@rsc-utils/io-utils";

/**
 * Wraps the given content in <> if it is a url.
 * If the all flag is true, then all urls in the content will be wrapped.
 */
export function wrapUrl(content: string, all?: boolean): string {
	// do a regex replace all
	if (all) {
		const regex = getUrlRegex({ gFlag:"g", wrapChars:"<>", wrapOptional:true });
		return content.replace(regex, url => isWrapped(url, "<>") ? url : wrap(url, "<>"));
	}

	// wrap an unwrapped anchored url
	const regex = getUrlRegex({ anchored:true });
	return regex.test(content) ? wrap(content, "<>") : content;
}