import type { Optional } from "../../types/generics.js";
import { splitChars } from "./splitChars.js";

/**
 * Used to wrap a piece of text, usually with (), [], {}, or <>.
 * splitChars() is used to split/convert the given chars into left/right.
 */
export function wrap(input: string, chars: string): string;
export function wrap(input: Optional<string>, chars: string): Optional<string>;
export function wrap(input: Optional<string>, chars: string): Optional<string> {
	if (input && chars?.length) {
		const { left, right } = splitChars(chars);
		return `${left}${input}${right}`;
	}
	return input;
}
