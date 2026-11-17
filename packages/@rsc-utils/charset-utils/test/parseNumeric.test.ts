import { describe, expect, test } from "vitest";
import { parseNumeric, parseNumericString, toSuperscript } from "../build/index.js";

describe("parseNumeric", () => {

	describe("plain numeric strings pass through to number-utils parsing", () => {

		test(`decimal`, () => {
			expect(parseNumeric(`12345678.09`)).toBe(12345678.09);
		});

		test(`negative decimal`, () => {
			expect(parseNumeric(`-12345678.09`)).toBe(-12345678.09);
		});

		test(`long integer becomes a bigint`, () => {
			expect(parseNumeric(`12345678123456709`)).toBe(12345678123456709n);
		});

		test(`non-numeric string yields NaN`, () => {
			expect(parseNumeric(`blah`)).toBeNaN();
		});

	});

	describe("superscript scripted numbers", () => {

		test(`decimal with the dot-operator period`, () => {
			expect(parseNumeric(`¹²³⁴⁵⁶⁷⁸⋅⁰⁹`)).toBe(12345678.09);
		});

		test(`leading superscript minus`, () => {
			expect(parseNumeric(`⁻¹²³⁴⁵⁶⁷⁸⋅⁰⁹`)).toBe(-12345678.09);
		});

		test(`long digits become a bigint`, () => {
			expect(parseNumeric(`¹²³⁴⁵⁶⁷⁸¹²³⁴⁵⁶⁷⁰⁹`)).toBe(12345678123456709n);
		});

		test(`leading superscript plus is dropped (value stays positive)`, () => {
			expect(parseNumeric(`⁺¹²³`)).toBe(123);
		});

	});

	describe("subscript scripted numbers", () => {

		test(`decimal with the one-dot-leader period`, () => {
			expect(parseNumeric(`₁₂₃₄₅₆₇₈․₀₉`)).toBe(12345678.09);
		});

		test(`leading subscript minus`, () => {
			expect(parseNumeric(`₋₅`)).toBe(-5);
		});

		test(`long digits become a bigint`, () => {
			expect(parseNumeric(`₁₂₃₄₅₆₇₈₁₂₃₄₅₆₇₀₉`)).toBe(12345678123456709n);
		});

		test(`negative long digits become a negative bigint`, () => {
			expect(parseNumeric(`₋₁₂₃₄₅₆₇₈₁₂₃₄₅₆₇₀₉`)).toBe(-12345678123456709n);
		});

	});

	describe("invalid scripted shapes yield NaN", () => {

		test(`two decimal periods are rejected`, () => {
			expect(parseNumeric(`¹⋅²⋅³`)).toBeNaN();
		});

		test(`plus not at the beginning is rejected`, () => {
			expect(parseNumeric(`₁₂⁺`)).toBeNaN();
		});

	});

});

describe("parseNumericString", () => {

	describe("type carries the script origin", () => {

		test(`plain decimal is "number"`, () => {
			expect(parseNumericString(`12345678.09`).type).toBe("number");
		});

		test(`plain long integer is "bigint"`, () => {
			expect(parseNumericString(`12345678123456709`).type).toBe("bigint");
		});

		test(`superscript decimal is "super-number"`, () => {
			expect(parseNumericString(`¹²³⁴⁵⁶⁷⁸⋅⁰⁹`).type).toBe("super-number");
		});

		test(`superscript long integer is "super-bigint"`, () => {
			// built via toSuperscript (covered by its own suite) rather than hand-typing 17 scripted digits
			expect(parseNumericString(toSuperscript(12345678123456709n)).type).toBe("super-bigint");
		});

		test(`subscript decimal is "sub-number"`, () => {
			expect(parseNumericString(`₁₂₃₄₅₆₇₈․₀₉`).type).toBe("sub-number");
		});

		test(`subscript long integer is "sub-bigint"`, () => {
			expect(parseNumericString(`₁₂₃₄₅₆₇₈₁₂₃₄₅₆₇₀₉`).type).toBe("sub-bigint");
		});

		test(`non-numeric string is "number" with isNaN`, () => {
			const results = parseNumericString(`blah`);
			expect(results.type).toBe("number");
			expect(results.isNaN).toBe(true);
		});

	});

	describe("results distinguish the unscripted stringValue from the original value", () => {

		test(`stringValue is the converted plain form, value keeps the scripted original`, () => {
			const results = parseNumericString(`¹²³`);
			expect(results.stringValue).toBe(`123`);
			expect(results.value).toBe(`¹²³`);
		});

		test(`plain input leaves stringValue and value identical`, () => {
			const results = parseNumericString(`42`);
			expect(results.stringValue).toBe(`42`);
			expect(results.value).toBe(`42`);
		});

	});

});
