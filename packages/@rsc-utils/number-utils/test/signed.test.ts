import { describe, expect, test } from "vitest";
import { signed } from "../build/index.js";

describe("signed", () => {

	describe("positive values get a leading +", () => {

		test(`5 → "+5"`, () => {
			expect(signed(5)).toBe("+5");
		});

		test(`0 is not negative, so it gets "+0"`, () => {
			expect(signed(0)).toBe("+0");
		});

		test(`-0 compares as >= 0, so it also gets "+0"`, () => {
			expect(signed(-0)).toBe("+0");
		});

		test(`Infinity → "+Infinity"`, () => {
			expect(signed(Infinity)).toBe("+Infinity");
		});

		test(`NaN is not < 0, so it gets "+NaN"`, () => {
			expect(signed(NaN)).toBe("+NaN");
		});

	});

	describe("negative values get a leading U+2212 minus sign", () => {

		test(`-5 → "−5" (fixed: used to emit the double sign "−-5")`, () => {
			expect(signed(-5)).toBe("−5");
		});

		test(`the negative marker is U+2212 MINUS SIGN, not an ASCII hyphen, and appears exactly once`, () => {
			const result = signed(-42);
			expect(result.startsWith("−")).toBe(true);
			expect(result.includes("-")).toBe(false);
			expect([...result].map((c) => c.codePointAt(0))).toEqual([0x2212, 52, 50]);
		});

		test(`-Infinity → "−Infinity" with a single sign`, () => {
			expect(signed(-Infinity)).toBe("−Infinity");
		});

		test(`decimals keep their fraction after the sign`, () => {
			expect(signed(-1.5)).toBe("−1.5");
		});

	});

	describe("round-trip with consumers", () => {

	test(`a U+2212-prefixed result normalizes back to ASCII via startsWith/slice (see processSortTag)`, () => {
		const value = signed(-42);
		expect(value.startsWith("−")).toBe(true);
		const normalized = "-" + value.slice(1);
		expect(normalized).toBe("-42");
	});

	});

});
