import { URL } from "node:url";

/**
 * Discord attachment cdn urls include timeout information.
 * They did this to avoid discord being used as a file share.
 * It creates an issue when folks use attached images for things like character tokens because ...
 * ... the map engine uses a standard http GET and often gets a 404 from these cdn images.
 */
export function isDiscordAttachmentCdnUrl(value: string): boolean {
	if (!value) return false;
	const url = new URL(value);
	return url
		&& (url.host === "cdn.discordapp.com" || url.host === "media.discordapp.net")
		&& url.pathname.startsWith("/attachments/")
		&& url.searchParams.has("ex")
		&& url.searchParams.has("is")
		&& url.searchParams.has("hm")
		? true
		: false;
}