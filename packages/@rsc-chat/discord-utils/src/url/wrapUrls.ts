import { globalizeRegExp, wrapExactRegExp } from "@rsc-utils/regexp-utils";
import type { Optional, OrNull, OrUndefined } from "@rsc-utils/type-utils";
import { UrlRegExp } from "@rsc-utils/url-utils";

const WrappedUrlRegExpG = globalizeRegExp(wrapExactRegExp(UrlRegExp, "<>", { optional:true }));

/**
 * Wraps all urls in the content with <>.
 */
export function wrapUrls(content: string): string;
export function wrapUrls(content: OrNull<string>): OrNull<string>
export function wrapUrls(content: OrUndefined<string>): OrUndefined<string>;
export function wrapUrls(content: Optional<string>): Optional<string>;
export function wrapUrls(content: Optional<string>): Optional<string> {
	if (!content) return content;
	return content.replace(WrappedUrlRegExpG, url => url.startsWith("<") ? url : `<${url}>`);
}