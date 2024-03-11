import { splitChars } from "./splitChars.js";

/**
 * Returns the characters wrapping the content, usually (), [], {}, or <>.
 * Returns false if the content is not wrapped by the given characters.
 * If the chars argument is even, then they are split and used as left/right.
 * If the chars argument is odd, then they are uesd as left and then they are reversed and used as right.
 */
export function isWrapped(input: string, chars: string): boolean {
	const { left, right } = splitChars(chars);
	return input.startsWith(left) && input.endsWith(right);
}