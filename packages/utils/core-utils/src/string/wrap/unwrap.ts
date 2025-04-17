import type { Optional } from "../../types/generics.js";
import { splitChars } from "./splitChars.js";

/**
 * Used to unwrap a piece of text, usually (), [], {}, or <>.
 * If the chars argument is even, then they are split and used as left/right.
 * If the chars argument is odd, then they are uesd as left and then they are reversed and used as right.
 */
export function unwrap(input: string, chars: string): string;
export function unwrap(input: Optional<string>, chars: string): Optional<string>;
export function unwrap(input: Optional<string>, chars: string): Optional<string> {
	if (input && chars?.length) {
		const { left, right } = splitChars(chars);
		while (input.startsWith(left) && input.endsWith(right)) {
			input = input.slice(left.length, -right.length) as string;
		}
	}
	return input;
}
