import { stringifyJson } from "@rsc-utils/core-utils";

/**
 * @internal
 * Ensures we have content that can be written to file.
 * Buffers and strings are passed on, an Object is converted using stringify.
 */
export function contentToFileOutput<T>(content: T, formatted?: boolean): string | Buffer {
	if (Buffer.isBuffer(content)) {
		return content;
	}

	if (typeof(content) === "string") {
		return content;
	}

	let space: "\t" | undefined;
	let maxLineLength: number | undefined;
	if (formatted) {
		space = "\t";
		maxLineLength = 250;
	}

	return stringifyJson(content, null, space, maxLineLength);
}
