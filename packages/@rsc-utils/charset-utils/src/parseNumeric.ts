import { parseNumericString as parsePlainNumericString, type NumericResults as PlainNumericResults } from "@rsc-utils/number-utils";
import { getSubscriptCharSet } from "./getSubscriptCharSet.js";
import { getSuperscriptCharSet } from "./getSuperscriptCharSet.js";
import type { ScriptedCharSet } from "./ScriptedCharSet.js";

export type NumericType = "number" | "super-number" | "sub-number"
	| "bigint" | "super-bigint" | "sub-bigint";

export type NumericResults = Omit<PlainNumericResults, "type"> & {
	type: NumericType;
};

function findCharSet(value: string): ScriptedCharSet | undefined {
	const getters = [getSuperscriptCharSet, getSubscriptCharSet];
	for (const getter of getters) {
		const charSet = getter();
		if (charSet.numberRegex.test(value)) {
			return charSet;
		}
	}
	return undefined;
}

function scriptedToUnscripted(value: string): { charSet:ScriptedCharSet; stringValue:string; } | undefined {
	// split number into characters
	const chars = value.split("");

	// get valid scripted character set
	const charSet = findCharSet(value);
	if (!charSet) return undefined;

	// convert to normal chars
	let stringValue = "";
	for (const char of chars) {
		if (char === charSet.period) {
			// can't have two decimals
			if (stringValue.includes(".")) return undefined;
			stringValue += ".";

		}else if (char === charSet.plus) {
			// the plus can only be at the beginning
			if (stringValue.length) return undefined;
			// we don't actually use the plus

		}else if (char === charSet.minus) {
			// the minus can only be at the beginning
			if (stringValue.length) return undefined;
			stringValue = "-";

		}else {
			const index = charSet.numbers.indexOf(char);
			// must be a valid number
			if (index < 0) return undefined;
			stringValue += "0123456789"[index];
		}
	}

	return { stringValue, charSet };
}

/** Parses the given numeric string into a number, bigint, or NaN. */
export function parseNumeric(value: string): number | bigint {
	return parseNumericString(value).numericValue;
}

/**
 * Parses a stringValue into different bits of information about the number.
 * Plain numeric strings are handled by @rsc-utils/number-utils; this version additionally understands super/subscript scripted numbers.
 */
export function parseNumericString(value: string): NumericResults {
	// try plain first — if it parses, no scripting is involved
	const plain = parsePlainNumericString(value);
	if (!plain.isNaN) return plain;

	// see if we need to convert from super/sub
	const unscriptedResults = scriptedToUnscripted(value);
	if (unscriptedResults) {
		const { charSet, stringValue } = unscriptedResults;
		const parsedNumber = parsePlainNumericString(stringValue);
		const type = `${charSet.type}-${parsedNumber.isBigInt ? "bigint" : "number"}` as NumericType;
		return { ...parsedNumber, type, value };
	}

	return plain;
}
