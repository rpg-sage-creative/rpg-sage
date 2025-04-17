import { getSubscriptCharSet } from "../characters/getSubscriptCharSet.js";
import { getSuperscriptCharSet } from "../characters/getSuperscriptCharSet.js";
import type { ScriptedCharSet } from "../characters/types.js";
import { getNumberRegex } from "./getNumberRegex.js";

type NumberResults = {
	isBigInt: boolean;
	isNaN: boolean;
	isNumber: boolean;
	numericValue: number | bigint;
	stringValue: string;
};

/** Parses the given numeric string into a number, bigint, or NaN. */
function _parseNumber(value: string): number | bigint {
	const regex = getNumberRegex({ anchored:true });
	if (!regex.test(value)) {
		return NaN;
	}

	// check integer only for BigInt
	if (/^-?\d+$/.test(value)) {
		const length = value.replace(/^-/, "").length;
		if (length < 16) {
			return Number(value);
		}
		if (length > 16) {
			return BigInt(value);
		}

		const big = BigInt(value);
		if (big > Number.MAX_SAFE_INTEGER || big < Number.MIN_SAFE_INTEGER) {
			return big;
		}

		return Number(value);
	}

	return Number(value);
}

/** Parses a stringValue into different bits of information about the number. */
function parseNumber(stringValue: string): NumberResults {

	// parse the numeric
	const numericValue = _parseNumber(stringValue);

	// return bigint
	if (typeof(numericValue) === "bigint") {
		return {
			isBigInt: true,
			isNaN: false,
			isNumber: false,
			numericValue,
			stringValue
		};
	}

	// check for NaN
	const nan = isNaN(numericValue);

	// return number
	return {
		isBigInt: false,
		isNaN: nan,
		isNumber: !nan,
		numericValue,
		stringValue
	};
}

type NumericType = "number" | "super-number" | "sub-number"
	| "bigint" | "super-bigint" | "sub-bigint";

type NumericResults = {
	isBigInt: boolean;
	isNaN: boolean;
	isNumber: boolean;
	numericValue: number | bigint;
	stringValue: string;
	type: NumericType;
	value: string;
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

/** @internal exported only for testing */
export function parseNumericString(value: string): NumericResults {
	const numberRegex = getNumberRegex({ anchored:true });

	let charSetType: "sub" | "super" | undefined;
	let stringValue = value;

	// see if we need to convert from super/sub
	if (!numberRegex.test(value)) {
		const unscriptedResults = scriptedToUnscripted(value);
		if (unscriptedResults) {
			charSetType = unscriptedResults.charSet.type;
			stringValue = unscriptedResults.stringValue;
		}
	}

	const parsedNumber = parseNumber(stringValue);
	const type = [charSetType, parsedNumber.isBigInt ? "bigint" : "number"].filter(s => s).join("-") as NumericType;
	return { ...parsedNumber, type, value };
}

/** Parses the given numeric string into a number, bigint, or NaN. */
export function parseNumeric(value: string): number | bigint {
	return parseNumericString(value).numericValue;
}