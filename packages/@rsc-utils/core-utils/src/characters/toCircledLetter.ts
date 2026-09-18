import { rangeError } from "@rsc-utils/type-utils";

type Options = {
	/** negative circled letters (white letter on black circle) */
	negative?: boolean;
};

/**
 * Returns a circled letter for the given value and options.
 * If a particular combination of value/options doesn't have a circled letter, an empty string is returned.
 * Throws a RangeError if the value isn't a letter between a-z or A-Z
 */
export function toCircledLetter(value: string): string;
export function toCircledLetter(value: string, options: Options): string;
export function toCircledLetter(value: string, options?: Options): string {
	// get the letter's code so we can check case and calculate deltas
	const charCode = value.charCodeAt(0);

	const isUpper = 64 < charCode && charCode < 91;
	const isLower = 96 < charCode && charCode < 123;
	if (!isUpper && !isLower) {
		throw rangeError({
			argKey: "letter",
			mustBe: "a letter from a-z or A-Z",
			value,
		});
	}

	// testing options this way allows for a number to be passed in via an array.map call
	const negative = options?.negative === true;

	let charDelta = 65;        // uppercase "A" is 65       "\u41"
	let circleA = negative
		? 127312               // uppercase "🅐" is 127312  "\u1f150"
		: 9398;                // uppercase "Ⓐ" is 9398    "\u24b6"

	// adjust values for lowercase letters
	if (charCode > 96) {
		// there are no lowercase negative circle letters as of the writing of this code
		if (negative) return "";

		circleA = 9424;        // lowercase "ⓐ" is 9424    "\u24d0"
		charDelta = 97;        // lowercase "a" is 97       "\u61"
	}

	// use charCode and charDelta to create circleDelta
	const circleDelta = charCode - charDelta;

	// return calculated circle letter
	return String.fromCodePoint(circleA + circleDelta);
}