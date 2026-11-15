import { describe, expect, test } from "vitest";
import { QuotedNumberRegExp } from "../build/index.js";

describe("QuotedNumberRegExp", () => {

	describe("matches numbers in any quote pair", () => {

		test(`integer in simple doubles "42"`, () => {
			expect(QuotedNumberRegExp.exec(`"42"`)?.[0]).toBe(`"42"`);
		});

		test(`signed integer "+3"`, () => {
			expect(QuotedNumberRegExp.exec(`"+3"`)?.[0]).toBe(`"+3"`);
		});

		test(`negative decimal "-3.5"`, () => {
			expect(QuotedNumberRegExp.exec(`"-3.5"`)?.[0]).toBe(`"-3.5"`);
		});

		test(`trailing-zero decimal "42.0"`, () => {
			expect(QuotedNumberRegExp.exec(`"42.0"`)?.[0]).toBe(`"42.0"`);
		});

		test(`spaces around the number are allowed: “ 42 ”`, () => {
			expect(QuotedNumberRegExp.exec(`“ 42 ”`)?.[0]).toBe(`“ 42 ”`);
		});

		test(`simple singles '42'`, () => {
			expect(QuotedNumberRegExp.exec(`'42'`)?.[0]).toBe(`'42'`);
		});

		test(`fancy singles ‘42’`, () => {
			expect(QuotedNumberRegExp.exec(`‘42’`)?.[0]).toBe(`‘42’`);
		});

	});

	describe("non-matches", () => {

		test(`empty content "" — a number is required`, () => {
			expect(QuotedNumberRegExp.exec(`""`)).toBeNull();
		});

		test(`bare decimal .5 is not accepted (digit before the dot required)`, () => {
			expect(QuotedNumberRegExp.exec(`".5"`)).toBeNull();
		});

		test(`scientific notation +1e5 is not accepted`, () => {
			expect(QuotedNumberRegExp.exec(`'+1e5'`)).toBeNull();
		});

		test(`space between sign and value "- .5" fails`, () => {
			expect(QuotedNumberRegExp.exec(`"- .5"`)).toBeNull();
		});

		test(`two numbers "1 2" fail (only surrounding spaces allowed)`, () => {
			expect(QuotedNumberRegExp.exec(`"1 2"`)).toBeNull();
		});

		test(`non-numeric content "abc" fails`, () => {
			expect(QuotedNumberRegExp.exec(`"abc"`)).toBeNull();
		});

	});

	test(`matches quoted-number substrings anywhere — not anchored`, () => {
		expect(QuotedNumberRegExp.exec(`x"42"y`)?.[0]).toBe(`"42"`);
	});

});
