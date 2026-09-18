import { typeError } from "@rsc-utils/type-utils";

type WrapChars = { left:string; right:string; };

/**
 * Splits the chars into left and right, primarily for use when wrapping text in pairs such as (), ||, and the like.
 * If the chars argument is even, then they are split evenly and used as left/right, such as "()" becoming `{ left:"(", right:")" }`.
 * If the chars argument is odd, then they are used as left and then they are reversed and used as right, such as "_*~" becoming `{ left:"_*~", right:"~*_" }`.
 */
export function splitWrapChars(chars: string): WrapChars {
	// ensure valid input
	if (!chars?.trim().length) {
		throw typeError({ argKey:"chars", mustBe:"a non-blank string", value:chars });
	}

	//even
	if (chars.length % 2 === 0) {
		const half = chars.length / 2;
		return {
			left: chars.slice(0, half),
			right: chars.slice(half)
		};
	}

	//odd
	return {
		left: chars,
		right: chars.split("").reverse().join("")
	};
}

/** @deprecated renamed to splitWrapChars */
export const splitChars = splitWrapChars;