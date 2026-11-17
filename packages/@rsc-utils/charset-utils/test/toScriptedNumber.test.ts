import { describe, expect, test } from "vitest";
import { getSubscriptCharSet, getSuperscriptCharSet, toScriptedNumber } from "../build/index.js";

describe("toScriptedNumber", () => {

	const sub = getSubscriptCharSet();
	const sup = getSuperscriptCharSet();

	describe("maps digits and math chars through the given char set", () => {

		test(`digits with the subscript set`, () => {
			expect(toScriptedNumber(123, sub)).toBe(`₁₂₃`);
		});

		test(`digits with the superscript set`, () => {
			expect(toScriptedNumber(123, sup)).toBe(`¹²³`);
		});

		test(`zero converts`, () => {
			expect(toScriptedNumber(0, sub)).toBe(`₀`);
		});

		test(`minus sign maps to the set's minus char: -12.5 with superscript`, () => {
			expect(toScriptedNumber(-12.5, sup)).toBe(`⁻¹²⋅⁵`);
		});

		test(`period maps to the set's period char (sub uses U+2024)`, () => {
			expect(toScriptedNumber(1.5, sub)).toBe(`₁․₅`);
		});

		test(`bigint input is supported`, () => {
			expect(toScriptedNumber(9876543210n, sup)).toBe(`⁹⁸⁷⁶⁵⁴³²¹⁰`);
		});

	});

	describe("quirks", () => {

		test(`characters outside digits/minus/period are silently dropped (join drops undefined entries)`, () => {
			// String(1e21) === "1e+21" — the "e" and "+" have no scripted counterpart
			expect(toScriptedNumber(1e21, sub)).toBe(`₁₂₁`);
		});

		test(`NaN produces an empty string (quirk)`, () => {
			expect(toScriptedNumber(NaN, sup)).toBe(``);
		});

	});

});
