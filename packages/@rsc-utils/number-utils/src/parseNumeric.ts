import { isIntegerString, isNumberString } from "@rsc-utils/type-utils";

type NumberResults = {
	isBigInt: boolean;
	isNaN: boolean;
	isNumber: boolean;
	numericValue: number | bigint;
	stringValue: string;
};

/** Parses the given numeric string into a number, bigint, or NaN. */
function _parseNumber(value: string): number | bigint {
	if (!isNumberString(value)) {
		return NaN;
	}

	// check integer only for BigInt
	if (isIntegerString(value)) {
		const length = value.length - (value.startsWith("-") ? 1 : 0);
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

export type NumericType = "number" | "bigint";

export type NumericResults = {
	isBigInt: boolean;
	isNaN: boolean;
	isNumber: boolean;
	numericValue: number | bigint;
	stringValue: string;
	type: NumericType;
	value: string;
};

/**
 * Parses a stringValue into different bits of information about the number.
 * Only plain numeric strings are understood here — for super/subscript scripted numbers, use parseNumericString from @rsc-utils/charset-utils.
 */
export function parseNumericString(value: string): NumericResults {
	const parsedNumber = parseNumber(value);
	return {
		...parsedNumber,
		type: parsedNumber.isBigInt ? "bigint" : "number",
		value
	};
}

/** Parses the given numeric string into a number, bigint, or NaN. */
export function parseNumeric(value: string): number | bigint {
	return parseNumericString(value).numericValue;
}
