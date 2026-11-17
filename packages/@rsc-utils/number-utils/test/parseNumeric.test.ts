import { describe, expect, test } from "vitest";
import { parseNumeric, parseNumericString } from "../build/index.js";

describe("parseNumeric", () => {

	describe("plain numeric strings", () => {

		test(`decimal`, () => {
			expect(parseNumeric(`12345678.09`)).toBe(12345678.09);
		});

		test(`negative decimal`, () => {
			expect(parseNumeric(`-12345678.09`)).toBe(-12345678.09);
		});

		test(`long integer becomes a bigint`, () => {
			expect(parseNumeric(`12345678123456709`)).toBe(12345678123456709n);
		});

		test(`negative long integer becomes a negative bigint`, () => {
			expect(parseNumeric(`-12345678123456709`)).toBe(-12345678123456709n);
		});

		test(`non-numeric string yields NaN`, () => {
			expect(parseNumeric(`blah`)).toBeNaN();
		});

	});

	describe("scripted numbers are NOT understood here (split out to @rsc-utils/charset-utils)", () => {

		test(`subscript digits yield NaN — use parseNumeric from charset-utils for super/sub input`, () => {
			expect(parseNumeric(`₁₂₃`)).toBeNaN();
		});

		test(`superscript digits yield NaN too`, () => {
			expect(parseNumeric(`¹²³`)).toBeNaN();
		});

	});

});

describe("parseNumericString", () => {

	describe("type reflects plain parsing only", () => {

		test(`"12345678.09" is type "number"`, () => {
			expect(parseNumericString(`12345678.09`).type).toBe("number");
		});

		test(`long integer is type "bigint"`, () => {
			expect(parseNumericString(`12345678123456709`).type).toBe("bigint");
		});

		test(`non-numeric string is still type "number" but isNaN`, () => {
			const results = parseNumericString(`blah`);
			expect(results.type).toBe("number");
			expect(results.isNaN).toBe(true);
		});

		test(`scripted input has no super/sub type here — it is simply NaN`, () => {
			const results = parseNumericString(`¹²³`);
			expect(results.type).toBe("number");
			expect(results.isNaN).toBe(true);
		});

	});

	describe("results carry both the parsed and original values", () => {

		test(`stringValue matches value for plain input`, () => {
			const results = parseNumericString(`42`);
			expect(results.stringValue).toBe(`42`);
			expect(results.value).toBe(`42`);
			expect(results.isNumber).toBe(true);
			expect(results.isBigInt).toBe(false);
		});

		test(`bigint results set isBigInt and clear isNumber`, () => {
			const results = parseNumericString(`12345678123456709`);
			expect(results.isBigInt).toBe(true);
			expect(results.isNumber).toBe(false);
		});

	});

});
