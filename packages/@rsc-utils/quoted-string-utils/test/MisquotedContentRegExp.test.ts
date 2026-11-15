import { describe, expect, test } from "vitest";
import { MisquotedContentRegExp } from "../build/index.js";

describe("MisquotedContentRegExp", () => {

	describe("matches mismatched pairs", () => {

		test(`simple open with fancy close "abc“`, () => {
			expect(MisquotedContentRegExp.exec(`"abc“`)?.[0]).toBe(`"abc“`);
		});

		test(`fancy open with simple close “abc"`, () => {
			expect(MisquotedContentRegExp.exec(`“abc"`)?.[0]).toBe(`“abc"`);
		});

		test(`right-right ”abc”`, () => {
			expect(MisquotedContentRegExp.exec(`”abc”`)?.[0]).toBe(`”abc”`);
		});

		test(`mismatched singles 'a‘`, () => {
			expect(MisquotedContentRegExp.exec(`'a‘`)?.[0]).toBe(`'a‘`);
		});

		test(`empty mismatched pair “" matches`, () => {
			expect(MisquotedContentRegExp.exec(`“"`)?.[0]).toBe(`“"`);
		});

	});

	describe("quirk: the character classes do not exclude matching pairs", () => {

		test(`properly quoted "a" also matches this pattern`, () => {
			expect(MisquotedContentRegExp.exec(`"a"`)?.[0]).toBe(`"a"`);
		});

		test(`properly quoted “a” also matches — isQuotedOrMisquoted checks Quoted first to disambiguate`, () => {
			expect(MisquotedContentRegExp.exec(`“a”`)?.[0]).toBe(`“a”`);
		});

	});

	describe("non-matches", () => {

		test(`unbalanced "abc has no close`, () => {
			expect(MisquotedContentRegExp.exec(`"abc`)).toBeNull();
		});

		test(`cross-family "abc' is in neither class pair`, () => {
			expect(MisquotedContentRegExp.exec(`"abc'`)).toBeNull();
		});

	});

});
