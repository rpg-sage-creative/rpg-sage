import { describe, expect, test } from "vitest";
import { toSubscript } from "../build/index.js";

describe("toSubscript", () => {

	test(`digits map one-for-one: 12345678.09`, () => {
		expect(toSubscript(12345678.09)).toBe(`₁₂₃₄₅₆₇₈․₀₉`);
	});

	test(`negative sign becomes the subscript minus prefix`, () => {
		expect(toSubscript(-12345678.09)).toBe(`₋₁₂₃₄₅₆₇₈․₀₉`);
	});

	test(`the decimal point is U+2024 ONE DOT LEADER, not a period`, () => {
		expect(toSubscript(1.5).codePointAt(1)!.toString(16)).toBe("2024");
	});

	test(`zero converts`, () => {
		expect(toSubscript(0)).toBe(`₀`);
	});

	test(`bigint input is supported`, () => {
		expect(toSubscript(12345678123456709n)).toBe(`₁₂₃₄₅₆₇₈₁₂₃₄₅₆₇₀₉`);
	});

	test(`negative bigint converts with the subscript minus`, () => {
		expect(toSubscript(-12345678123456709n)).toBe(`₋₁₂₃₄₅₆₇₈₁₂₃₄₅₆₇₀₉`);
	});

	test(`NaN returns "" — every char is unmapped and join drops undefined entries (quirk)`, () => {
		expect(toSubscript(NaN)).toBe(``);
	});

	test(`exponential notation silently loses the exponent: 1e21 becomes "₁₂₁" (quirk)`, () => {
		expect(toSubscript(1e21)).toBe(`₁₂₁`);
	});

	test(`Infinity returns "" like NaN (quirk)`, () => {
		expect(toSubscript(Infinity)).toBe(``);
	});

});
