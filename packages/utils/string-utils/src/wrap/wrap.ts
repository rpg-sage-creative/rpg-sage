import { splitChars } from "./splitChars.js";

/**
 * Used to wrap a piece of text, usually with (), [], {}, or <>.
 * If the chars argument is even, then they are split and used as left/right.
 * If the chars argument is odd, then they are uesd as left and then they are reversed and used as right.
 */
export function wrap(input: string, chars: string): string {
	const leftRight = splitChars(chars);
	if (leftRight) {
		return `${leftRight.left}${input}${leftRight.right}`;
	}
	return input;
}
