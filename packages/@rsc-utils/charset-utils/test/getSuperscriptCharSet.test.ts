import { describe, expect, test } from "vitest";
import { getSuperscriptCharSet } from "../build/index.js";

describe("getSuperscriptCharSet", () => {

	test(`returns the same memoized object on every call`, () => {
		expect(getSuperscriptCharSet()).toBe(getSuperscriptCharSet());
	});

	test(`type is "super"`, () => {
		expect(getSuperscriptCharSet().type).toBe("super");
	});

	test(`numbers holds the ten superscript digits in order`, () => {
		expect(getSuperscriptCharSet().numbers).toStrictEqual(["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"]);
	});

	test(`math chars are the superscript block`, () => {
		const set = getSuperscriptCharSet();
		expect(set.equals).toBe(`⁼`);
		expect(set.minus).toBe(`⁻`);
		expect(set.plus).toBe(`⁺`);
		expect(set.parentheses).toStrictEqual(["⁽", "⁾"]);
	});

	test(`period is U+22C5 DOT OPERATOR, not an ASCII period (quirk)`, () => {
		expect(getSuperscriptCharSet().period.codePointAt(0)).toBe(0x22c5);
	});

	describe("numberRegex matches scripted numbers only", () => {

		test(`matches plain digits: ¹²³`, () => {
			expect(getSuperscriptCharSet().numberRegex.test(`¹²³`)).toBe(true);
		});

		test(`matches signed values: ⁺¹² and ⁻⁵`, () => {
			expect(getSuperscriptCharSet().numberRegex.test(`⁺¹²`)).toBe(true);
			expect(getSuperscriptCharSet().numberRegex.test(`⁻⁵`)).toBe(true);
		});

		test(`matches its own period char: ¹⋅²`, () => {
			expect(getSuperscriptCharSet().numberRegex.test(`¹⋅²`)).toBe(true);
		});

		test(`rejects plain ASCII digits`, () => {
			expect(getSuperscriptCharSet().numberRegex.test(`123`)).toBe(false);
		});

		test(`anchored — rejects embedded matches like x¹²x`, () => {
			expect(getSuperscriptCharSet().numberRegex.test(`x¹²x`)).toBe(false);
		});

	});

});
