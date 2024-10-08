import { parseNumeric } from "../numeric/parseNumeric.js";

type Results = {
	isBigInt: boolean;
	isNaN: boolean;
	isNumber: boolean;
	numericValue: number | bigint;
	stringValue: string;
};

/** @internal Parses a stringValue into different bits of information about the number. */
export function parseNumber(stringValue: string): Results {

	// parse the numeric
	const numericValue = parseNumeric(stringValue);

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