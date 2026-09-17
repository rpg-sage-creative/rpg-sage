import type { Optional, OrNull, OrUndefined } from "@rsc-utils/core-utils";
import { getUrlRegex, type WRAPPED_URL, type URL } from "@rsc-utils/io-utils";

/**
 * Wraps the given content in <> if it is a url.
 */
export function wrapUrl(url: URL): WRAPPED_URL;
export function wrapUrl(url: OrNull<URL>): OrNull<WRAPPED_URL>
export function wrapUrl(url: OrUndefined<URL>): OrUndefined<WRAPPED_URL>;
export function wrapUrl(url: Optional<URL>): Optional<WRAPPED_URL>;
export function wrapUrl(url: Optional<string>): Optional<string> {
	if (!url) return url;
	// wrap an unwrapped anchored url
	const regex = getUrlRegex({ anchored:true });
	const wrapped = regex.test(url) ? `<${url}>` : url;
	return wrapped as WRAPPED_URL;
}