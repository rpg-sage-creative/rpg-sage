import { parseNumeric, parseNumericString, tagLiterals } from "../../build/index.js";

describe("number", () => {
	/** @type {[string, number | bigint, string][]} [input, output, type] */
	const tests = [
		["12345678.09", 12345678.09, "number"],
		["-12345678.09", -12345678.09, "number"],
		["12345678123456709", 12345678123456709n, "bigint"],
		["-12345678123456709", -12345678123456709n, "bigint"],
		["¹²³⁴⁵⁶⁷⁸\u22C5⁰⁹", 12345678.09, "super-number"],
		["⁻¹²³⁴⁵⁶⁷⁸\u22C5⁰⁹", -12345678.09, "super-number"],
		["¹²³⁴⁵⁶⁷⁸¹²³⁴⁵⁶⁷⁰⁹", 12345678123456709n, "super-bigint"],
		["⁻¹²³⁴⁵⁶⁷⁸¹²³⁴⁵⁶⁷⁰⁹", -12345678123456709n, "super-bigint"],
		["₁₂₃₄₅₆₇₈\u2024₀₉", 12345678.09, "sub-number"],
		["₋₁₂₃₄₅₆₇₈\u2024₀₉", -12345678.09, "sub-number"],
		["₁₂₃₄₅₆₇₈₁₂₃₄₅₆₇₀₉", 12345678123456709n, "sub-bigint"],
		["₋₁₂₃₄₅₆₇₈₁₂₃₄₅₆₇₀₉", -12345678123456709n, "sub-bigint"],
		["blah", NaN, "number"],
	];

	describe("parseNumeric", () => {
		tests.forEach(([input, output]) => {
			test(tagLiterals`parseNumeric(${input}) === ${output}`, () => {
				expect(parseNumeric(input)).toBe(output);
			});
		});
	});

	describe("parseNumericString", () => {
		tests.forEach(([input, output, type]) => {
			test(tagLiterals`parseNumericString(${input}).type === ${type}`, () => {
				expect(parseNumericString(input)?.type).toBe(type);
			});
		});
	});
});