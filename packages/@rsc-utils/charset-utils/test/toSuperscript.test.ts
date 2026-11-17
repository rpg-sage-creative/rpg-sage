import { describe, expect, test } from "vitest";
import { toSuperscript } from "../build/index.js";

describe("toSuperscript", () => {

	test(`digits map one-for-one: 12345678.09`, () => {
		expect(toSuperscript(12345678.09)).toBe(`¹²³⁴⁵⁶⁷⁸⋅⁰⁹`);
	});

	test(`negative sign becomes the superscript minus prefix`, () => {
		expect(toSuperscript(-12345678.09)).toBe(`⁻¹²³⁴⁵⁶⁷⁸⋅⁰⁹`);
	});

	test(`the decimal point is U+22C5 DOT OPERATOR, not a period (quirk)`, () => {
		expect(toSuperscript(1.5).codePointAt(1)!.toString(16)).toBe("22c5");
	});

	test(`zero converts`, () => {
		expect(toSuperscript(0)).toBe(`⁰`);
	});

	test(`bigint input is supported`, () => {
		expect(toSuperscript(12345678123456709n)).toBe(`¹²³⁴⁵⁶⁷⁸¹²³⁴⁵⁶⁷⁰⁹`);
	});

	test(`negative bigint converts with the superscript minus`, () => {
		expect(toSuperscript(-12345678123456709n)).toBe(`⁻¹²³⁴⁵⁶⁷⁸¹²³⁴⁵⁶⁷⁰⁹`);
	});

	test(`NaN returns "" — every char is unmapped and join drops undefined entries (quirk)`, () => {
		expect(toSuperscript(NaN)).toBe(``);
	});

	test(`exponential notation silently loses the exponent: 1e21 becomes "¹²¹" (quirk)`, () => {
		expect(toSuperscript(1e21)).toBe(`¹²¹`);
	});

	test(`Infinity returns "" like NaN (quirk)`, () => {
		expect(toSuperscript(Infinity)).toBe(``);
	});

});
