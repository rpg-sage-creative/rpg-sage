import { describe, expect, test } from "vitest";
import { addCommas } from "../build/index.js";

describe("addCommas", () => {

	describe("integers", () => {

		test(`123 → "123" (three digits get no comma)`, () => {
			expect(addCommas(123)).toBe("123");
		});

		test(`1234 → "1,234"`, () => {
			expect(addCommas(1234)).toBe("1,234");
		});

		test(`12345 → "12,345"`, () => {
			expect(addCommas(12345)).toBe("12,345");
		});

		test(`12345678 → "12,345,678"`, () => {
			expect(addCommas(12345678)).toBe("12,345,678");
		});

		test(`12345678901 → "12,345,678,901"`, () => {
			expect(addCommas(12345678901)).toBe("12,345,678,901");
		});

		test(`123456789012 → "123,456,789,012"`, () => {
			expect(addCommas(123456789012)).toBe("123,456,789,012");
		});

		test(`1234567890123 → "1,234,567,890,123"`, () => {
			expect(addCommas(1234567890123)).toBe("1,234,567,890,123");
		});

		test(`12345678901234 → "12,345,678,901,234"`, () => {
			expect(addCommas(12345678901234)).toBe("12,345,678,901,234");
		});

		test(`123456789012345 → "123,456,789,012,345"`, () => {
			expect(addCommas(123456789012345)).toBe("123,456,789,012,345");
		});

		test(`1234567890123456 → "1,234,567,890,123,456"`, () => {
			expect(addCommas(1234567890123456)).toBe("1,234,567,890,123,456");
		});

	});

	describe("bigints", () => {

		test(`20-digit bigint → "12,345,678,901,234,567,890"`, () => {
			expect(addCommas(12345678901234567890n)).toBe("12,345,678,901,234,567,890");
		});

		test(`21-digit bigint → "123,456,789,012,345,678,901"`, () => {
			expect(addCommas(123456789012345678901n)).toBe("123,456,789,012,345,678,901");
		});

		test(`22-digit bigint → "1,234,567,890,123,456,789,012"`, () => {
			expect(addCommas(1234567890123456789012n)).toBe("1,234,567,890,123,456,789,012");
		});

		test(`23-digit bigint → "12,345,678,901,234,567,890,123"`, () => {
			expect(addCommas(12345678901234567890123n)).toBe("12,345,678,901,234,567,890,123");
		});

		test(`24-digit bigint → "123,456,789,012,345,678,901,234"`, () => {
			expect(addCommas(123456789012345678901234n)).toBe("123,456,789,012,345,678,901,234");
		});

		test(`25-digit bigint → "1,234,567,890,123,456,789,012,345"`, () => {
			expect(addCommas(1234567890123456789012345n)).toBe("1,234,567,890,123,456,789,012,345");
		});

		test(`26-digit bigint → "12,345,678,901,234,567,890,123,456"`, () => {
			expect(addCommas(12345678901234567890123456n)).toBe("12,345,678,901,234,567,890,123,456");
		});

		test(`27-digit bigint → "123,456,789,012,345,678,901,234,567"`, () => {
			expect(addCommas(123456789012345678901234567n)).toBe("123,456,789,012,345,678,901,234,567");
		});

		test(`28-digit bigint → "1,234,567,890,123,456,789,012,345,678"`, () => {
			expect(addCommas(1234567890123456789012345678n)).toBe("1,234,567,890,123,456,789,012,345,678");
		});

		test(`29-digit bigint → "12,345,678,901,234,567,890,123,456,789"`, () => {
			expect(addCommas(12345678901234567890123456789n)).toBe("12,345,678,901,234,567,890,123,456,789");
		});

		test(`negative bigint keeps the sign outside the commas`, () => {
			expect(addCommas(-1234567n)).toBe("-1,234,567");
		});

	});

	describe("decimals", () => {

		test(`fractional part never receives commas`, () => {
			expect(addCommas(123.1)).toBe("123.1");
		});

		test(`1234.12345 → "1,234.12345"`, () => {
			expect(addCommas(1234.12345)).toBe("1,234.12345");
		});

		test(`1234567.1234567 → "1,234,567.1234567"`, () => {
			expect(addCommas(1234567.1234567)).toBe("1,234,567.1234567");
		});

		test(`12345678.1 → "12,345,678.1"`, () => {
			expect(addCommas(12345678.1)).toBe("12,345,678.1");
		});

		test(`123456789.12345 → "123,456,789.12345"`, () => {
			expect(addCommas(123456789.12345)).toBe("123,456,789.12345");
		});

		test(`1234567890.1234567 → "1,234,567,890.1234567"`, () => {
			expect(addCommas(1234567890.1234567)).toBe("1,234,567,890.1234567");
		});

		test(`12345678901.1 → "12,345,678,901.1"`, () => {
			expect(addCommas(12345678901.1)).toBe("12,345,678,901.1");
		});

		test(`negative decimal keeps the sign outside the commas`, () => {
			expect(addCommas(-1234.5)).toBe("-1,234.5");
		});

	});

	describe("signs and special values", () => {

		test(`0 → "0"`, () => {
			expect(addCommas(0)).toBe("0");
		});

		test(`-0 stringifies as "0" (String(-0) drops the sign)`, () => {
			expect(addCommas(-0)).toBe("0");
		});

		test(`negative integers get commas after the minus sign`, () => {
			expect(addCommas(-12345)).toBe("-12,345");
		});

		test(`NaN passes through unformatted`, () => {
			expect(addCommas(NaN)).toBe("NaN");
		});

		test(`Infinity passes through unformatted`, () => {
			expect(addCommas(Infinity)).toBe("Infinity");
		});

		test(`-Infinity keeps its ASCII hyphen (no U+2212 handling here)`, () => {
			expect(addCommas(-Infinity)).toBe("-Infinity");
		});

	});

	describe("quirks", () => {

		test(`exponential-form input passes through with no commas — String(1e21) is "1e+21"`, () => {
			expect(addCommas(1e21)).toBe("1e+21");
		});

		test(`tiny numbers stringify exponentially and pass through — the "fraction" even contains "e-7"`, () => {
			expect(addCommas(1.5e-7)).toBe("1.5e-7");
		});

		test(`doubles only hold ~17 significant digits — 123456789012.12345 rounds to ...12344 before addCommas sees it`, () => {
			expect(addCommas(123456789012.12345)).toBe("123,456,789,012.12344");
		});

		test(`beyond double precision the fraction is truncated — 123456789012345.12345 becomes ...345.12`, () => {
			expect(addCommas(123456789012345.12345)).toBe("123,456,789,012,345.12");
		});

	});

});
