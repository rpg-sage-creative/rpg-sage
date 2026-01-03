import type { SMessageOrPartial } from "@rsc-utils/discord-utils";

const ImageRegExp = /image/i;

/**
 * Returns true if the message has an attachment with contentType that includes "image" and also has a url.
 */
export function hasImageAttachment(message: SMessageOrPartial): boolean {
	for (const att of message.attachments.values()) {
		if (att.contentType && att.url && ImageRegExp.test(att.contentType)) {
			return true;
		}
	}
	return false;
}