import { typeError } from "@rsc-utils/type-utils";
import { numberOrUndefined } from "../number/numberOrUndefined.js";

type Options = {
	/** double circled numbers; only valid for 1-10 */
	double?: boolean;
	/** use dingbat variant; only valid for 0-10 */
	dingbat?: boolean;
	/** negative circled numbers (white number on black circle); only valid for 0-20 */
	negative?: boolean;
};

/** Processes double circled numbers (1-10) */
function processDouble(value: number, { dingbat, negative }: Omit<Options, "double">): string {
	// only numbers 1-10, no dingbat or negative variants
	if (dingbat || negative || value < 1 || value > 10) {
		return "";
	}

	// double circle one "⓵" is 9461; "\u24f5"
	const codePoint = 9461;

	// the starting codePoint is for 1, so we have to treat it as index 0
	const delta = value - 1;

	return String.fromCodePoint(codePoint + delta);
}

/** Processes dingbat circled numbers (0-10); regular and negative */
function processDingbat(value: number, negative: boolean): string {
	// only numbers 0-10
	if (value < 0 || value > 10) {
		return "";
	}

	let delta: number;
	let codePoint: number;

	if (value === 0) {
		codePoint = negative
			? 127244   // dingbat negative circled zero "🄌" is 127244  "\u1f10c"
			: 127243;  // dingbat circled zero "🄋" is 127243  "\u1f10b"

		// no delta for value 0
		delta = 0;

	}else {
		codePoint = negative
			? 10122   // dingbat negative circled one "➊" is 10122  "\u278a"
			: 10112;  // dingbat circled one "➀" is 10122  "\u2780"

		// the starting codePoint is for 1, so we have to treat it as index 0
		delta = value - 1;

	}

	return String.fromCodePoint(codePoint + delta);
}

/** Proesses negative circled numbers (0-20) */
function processNegative(value: number): string {
	// only numbers 0-20
	if (value < 0 || value > 20) {
		return "";
	}

	let delta: number;
	let codePoint: number;

	if (value === 0) {
		// negative circled zero "⓿" is 9471  "\u24ff"
		codePoint = 9471;

		// no delta for value 0
		delta = 0;

	}else if (value < 11) {
		// negative circled one "❶" is 10102  "\u2776"
		codePoint = 10102;

		// the starting codePoint is for 1, so we have to treat it as index 0
		delta = value - 1;

	}else {
		// negative circled 11 "⓫" is 9451  "\u24eb"
		codePoint = 9451;

		// reset the codeDelta for a starting value of 11
		delta = value - 11;

	}

	return String.fromCodePoint(codePoint + delta);
}

/** Proesses circled numbers (0-50) */
function process(value: number): string {
	// a zero based index for adjusting the codePoint within a block
	let delta: number;

	// the base code point for a block
	let codePoint: number;

	// 0
	if (value === 0) {
		// circled zero "⓪" is 9450  "\u24ea"
		codePoint = 9450;

		// no delta for value 0
		delta = 0;

	// 1-20
	}else if (value < 21) {
		// circled one "①" is 9312  "\u2460"
		codePoint = 9312;

		// the starting codePoint is for 1
		delta = value - 1;

	// 21-35
	}else if (value < 36) {
		// circled 21 "㉑" is 12881  "\u3251"
		codePoint = 12881;

		// the starting codePoint is for 21
		delta = value - 21;

	}else {
		// circled 36 "㊱" is 12977  "\u32B1"
		codePoint = 12977;

		// rthe starting codePoint is for 36
		delta = value - 36;
	}

	return String.fromCodePoint(codePoint + delta);
}

/**
 * Returns a circled number for the given value and options.
 * If a particular combination of value/options doesn't have a circled number, an empty string is returned.
 * Throws a TypeError if the value can't be coerced to a valid number.
 */
export function toCircledNumber(value: number | string): string;
export function toCircledNumber(value: number | string, options: Options): string;
export function toCircledNumber(value: number | string, options?: Options): string {
	// coerce/parse to number
	const number = numberOrUndefined(value);

	// ensure we have a number
	if (number === undefined) {
		throw typeError({
			argKey: "value",
			mustBe: "a number or string value that can be coerced to a number",
			value
		});
	}

	// we know that we only have values from 0 to 50
	if (number < 0 || number > 50) return "";

	// testing options this way allows for a number to be passed in via an array.map call
	const dingbat = options?.dingbat === true;
	const negative = options?.negative === true;

	// there are fewer double circled numbers, processing them is easier/simpler
	if (options?.double === true) {
		return processDouble(number, { dingbat, negative });
	}

	if (dingbat) {
		return processDingbat(number, negative);
	}

	if (negative) {
		return processNegative(number);
	}

	return process(number);
}