import type { Optional } from "../../types/generics.js";
import { splitChars } from "./splitChars.js";

/**
 * Returns true if the input has characters wrapped by the given characters, false otherwise.
 * If the chars argument is even, then they are split and used as left/right.
 * If the chars argument is odd, then they are uesd as left and then they are reversed and used as right.
 */
export function isWrapped(input: Optional<string>, chars: string): input is string {
	if (input && chars?.length) {
		const { left, right } = splitChars(chars);
		return input.length > left.length + right.length
			&& input.startsWith(left)
			&& input.endsWith(right);
	}
	return false;
}