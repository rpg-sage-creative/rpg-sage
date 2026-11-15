import { describe, expect, test } from "vitest";
import { QuotedContentRegExp } from "../build/index.js";

describe("QuotedContentRegExp", () => {

	test(`compiled in v mode and non-global — safe to exec repeatedly as a shared module constant`, () => {
		expect(QuotedContentRegExp.flags).toBe("v");
		expect(QuotedContentRegExp.global).toBe(false);
	});

	describe("matches all four quote pairs", () => {

		test(`simple doubles "abc"`, () => {
			expect(QuotedContentRegExp.exec(`"abc"`)?.[0]).toBe(`"abc"`);
		});

		test(`fancy doubles “abc”`, () => {
			expect(QuotedContentRegExp.exec(`“abc”`)?.[0]).toBe(`“abc”`);
		});

		test(`simple singles 'abc'`, () => {
			expect(QuotedContentRegExp.exec(`'abc'`)?.[0]).toBe(`'abc'`);
		});

		test(`fancy singles ‘abc’`, () => {
			expect(QuotedContentRegExp.exec(`‘abc’`)?.[0]).toBe(`‘abc’`);
		});

		test(`empty content "" matches`, () => {
			expect(QuotedContentRegExp.exec(`""`)?.[0]).toBe(`""`);
		});

	});

	describe("content rules", () => {

		test(`escaped quotes are allowed inside: "a\\"b"`, () => {
			const match = QuotedContentRegExp.exec(`"a\\"b"`);
			expect(match?.[0]).toBe(`"a\\"b"`);
			expect(match?.index).toBe(0);
		});

		test(`newlines are ordinary content`, () => {
			expect(QuotedContentRegExp.exec(`"a\nb"`)?.[0]).toBe(`"a\nb"`);
		});

		test(`other quote families are just content: "'‘“„"`, () => {
			expect(QuotedContentRegExp.exec(`"'‘“„"`)?.[0]).toBe(`"'‘“„"`);
		});

		test(`unbalanced "abc does not match`, () => {
			expect(QuotedContentRegExp.exec(`"abc`)).toBeNull();
		});

	});

	test(`matches quoted substrings anywhere — callers must check index and length (isQuotedOrMisquoted does)`, () => {
		const match = QuotedContentRegExp.exec(`x"a"y`);
		expect(match?.[0]).toBe(`"a"`);
		expect(match?.index).toBe(1);
	});

});
