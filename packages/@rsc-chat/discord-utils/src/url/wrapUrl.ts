import type { Optional, OrNull, OrUndefined } from "@rsc-utils/type-utils";
import { AnchoredUrlRegExp, type URL, type WRAPPED_URL } from "@rsc-utils/url-utils";

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
	const wrapped = AnchoredUrlRegExp.test(url) ? `<${url}>` : url;
	return wrapped as WRAPPED_URL;
}