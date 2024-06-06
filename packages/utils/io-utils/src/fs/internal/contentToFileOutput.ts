import { formattedStringify, stringify } from "@rsc-utils/core-utils";

/**
 * @internal
 * Ensures we have content that can be written to file.
 * Buffers and strings are passed on, an Object is converted using stringify or formattedStringify.
 */
export function contentToFileOutput<T>(content: T, formatted?: boolean): string | Buffer {
	if (Buffer.isBuffer(content)) {
		return content;
	}
	if (typeof(content) === "string") {
		return content;
	}
	return formatted
		? formattedStringify(content)
		: stringify(content);
}
