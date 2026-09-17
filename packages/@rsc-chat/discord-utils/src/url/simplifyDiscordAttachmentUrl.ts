import type { Optional } from "@rsc-utils/core-utils";

/**
 * Assists in comparing discord attachment image urls.
 * Removes querystring from links grabbed from the web (usually width/height).
 * Changes media.discordapp.net to cdn.discordapp.com.
 */
export function simplifyDiscordAttachmentUrl(url: string): string;
export function simplifyDiscordAttachmentUrl(url: Optional<string>): Optional<string>;
export function simplifyDiscordAttachmentUrl(url: Optional<string>): Optional<string> {
	if (!url) return url;
	// app https://cdn.discordapp.com/attachments/1140421024777781340/1141450682545745930/opal.png
	// web https://media.discordapp.net/attachments/1140421024777781340/1141450682545745930/opal.png?width=211&height=211
	const appPrefix = "https://cdn.discordapp.com";
	const webPrefix = "https://media.discordapp.net";
	if (url.startsWith(webPrefix)) {
		const endIndex = url.includes("?") ? url.indexOf("?") : undefined;
		return appPrefix + url.slice(webPrefix.length, endIndex);
	}
	return url;
}