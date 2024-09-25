import { parseNumber } from "./internal/parseNumber.js";
import { parseScriptedNumber } from "./internal/parseScriptedNumber.js";
import { getSuperscriptCharacters } from "./superscript/getSuperscriptCharacters.js";

type NumberType = "number" | "super-number" | "sub-number"
	| "bigint" | "super-bigint" | "sub-bigint";

type ParseResults = {
	isBigInt: boolean;
	isNaN: boolean;
	isNumber: boolean;
	numericValue: number | bigint;
	stringValue: string;
	type: NumberType;
	value: string;
};


export function parseNumberString(value: string): ParseResults | undefined {
	// check for our serialized format of "bigint-{number}n"
	if (/^bigint-\d+n$/.test(value)) {
		return {
			isBigInt: true,
			isNaN: false,
			isNumber: false,
			numericValue: BigInt(value.slice(7, -1)),
			stringValue: value,
			type: "bigint",
			value
		};
	}

	// see if we need to convert super/sub
	if (/[^\d\.-]/.test(value)) {
		const superResults = parseScriptedNumber(value, getSuperscriptCharacters());
		if (superResults) {
			if (superResults.isBigInt) return { ...superResults, type:"super-bigint" };
			if (superResults.isNumber) return { ...superResults, type:"super-number" };
			return undefined;
		}

		const subResults = parseScriptedNumber(value, getSuperscriptCharacters());
		if (subResults) {
			if (subResults.isBigInt) return { ...subResults, type:"sub-bigint" };
			if (subResults.isNumber) return { ...subResults, type:"sub-number" };
			return undefined;
		}
	}

	if (!/-?\d+(\.\d+)?/.test(value)) return undefined;

	const parsedNumber = parseNumber(value);
	return {
		...parsedNumber,
		type: parsedNumber.isBigInt ? "bigint" : "number",
		value
	};
}