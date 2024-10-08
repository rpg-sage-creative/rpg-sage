import { parseNumber } from "./parseNumber.js";

type Results = {
	isBigInt: boolean;
	isNaN: boolean;
	isNumber: boolean;
	numericValue: number | bigint;
	stringValue: string;
	value: string;
};

/** @internal Parses a superscript or subscript number. */
export function parseScriptedNumber(value: string, characters: string[]): Results | undefined {
	const regularNumbers = "0123456789";

	// get other period / numbers
	const period = characters[11];
	const numbers = characters.slice(0, 10);

	// convert to normal chars
	let stringValue = "";
	const chars = value.split("");
	for (const char of chars) {
		if (char === period) {
			// can't have two decimals
			if (stringValue.includes(".")) return undefined;
			stringValue += ".";
		}else {
			const index = numbers.indexOf(char);
			// must be a valid number
			if (index < 0) return undefined;
			stringValue += regularNumbers[index];
		}
	}

	const parsedNumber = parseNumber(stringValue);
	return { ...parsedNumber, value };
}