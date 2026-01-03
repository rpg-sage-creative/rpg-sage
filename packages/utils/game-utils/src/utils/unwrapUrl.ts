import type { Optional, OrNull, OrUndefined } from "@rsc-utils/core-utils";

export function unwrapUrl(url: string): string;
export function unwrapUrl(url: OrNull<string>): OrNull<string>
export function unwrapUrl(url: OrUndefined<string>): OrUndefined<string>;
export function unwrapUrl(url: Optional<string>): Optional<string>;
export function unwrapUrl(url: Optional<string>): Optional<string> {
	if (!url) return url;
	return url.startsWith("<") && url.endsWith(">")
		? url.slice(1, -1)
		: url;
}