import type { Optional } from "./Optional.js";

/**
 * @internal
 * Gets a RegExpMatchArray from the value that includes color and alpha.
 */
export function matchHex(value: Optional<string>): RegExpMatchArray | null {
	if (value) {
		const regex = /^(?:0X|#)?((?:[0-9A-F]{3}){1,2})([0-9A-F]{1,2})?$/;
		return regex.exec(value.trim().toUpperCase());
	}
	return null;
}
