import type { Optional } from "@rsc-utils/type-utils";
import { splitWrapChars } from "./splitWrapChars.js";

/**
 * Used to wrap a piece of text, usually with (), [], {}, or <>.
 * splitWrapChars() is used to split/convert the given chars into left/right.
 */
export function wrap(input: string, chars: string): string;
export function wrap(input: Optional<string>, chars: string): Optional<string>;
export function wrap(input: Optional<string>, chars: string): Optional<string> {
	if (input && chars?.length) {
		const { left, right } = splitWrapChars(chars);
		return left + input + right;
	}
	return input;
}
