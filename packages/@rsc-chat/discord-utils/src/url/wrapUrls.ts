import type { Optional, OrNull, OrUndefined } from "@rsc-utils/core-utils";
import { getUrlRegex } from "@rsc-utils/io-utils";

/**
 * Wraps all urls in the content with <>.
 */
export function wrapUrls(content: string): string;
export function wrapUrls(content: OrNull<string>): OrNull<string>
export function wrapUrls(content: OrUndefined<string>): OrUndefined<string>;
export function wrapUrls(content: Optional<string>): Optional<string>;
export function wrapUrls(content: Optional<string>): Optional<string> {
	if (!content) return content;
	const regex = getUrlRegex({ gFlag:"g", wrapChars:"<>", wrapOptional:true });
	return content.replace(regex, url => url.startsWith("<") ? url : `<${url}>`);
}