import { describe, expect, test } from "vitest";
import { isQuotedOrMisquoted } from "../build/index.js";

describe("isQuotedOrMisquoted", () => {

	describe(`returns "quoted" for properly quoted values`, () => {

		test(`simple doubles`, () => {
			expect(isQuotedOrMisquoted(`"abc"`)).toBe("quoted");
		});

		test(`fancy doubles`, () => {
			expect(isQuotedOrMisquoted(`“abc”`)).toBe("quoted");
		});

		test(`simple singles`, () => {
			expect(isQuotedOrMisquoted(`'abc'`)).toBe("quoted");
		});

		test(`fancy singles`, () => {
			expect(isQuotedOrMisquoted(`‘abc’`)).toBe("quoted");
		});

		test(`empty pair ""`, () => {
			expect(isQuotedOrMisquoted(`""`)).toBe("quoted");
		});

	});

	describe(`returns "misquoted" for mismatched pairs — never for proper ones (order matters)`, () => {

		test(`mismatched doubles "abc“`, () => {
			expect(isQuotedOrMisquoted(`"abc“`)).toBe("misquoted");
		});

		test(`right-right ”abc”`, () => {
			expect(isQuotedOrMisquoted(`”abc”`)).toBe("misquoted");
		});

		test(`mismatched singles 'a’`, () => {
			expect(isQuotedOrMisquoted(`'a’`)).toBe("misquoted");
		});

		test(`proper "abc" wins over the misquoted pattern, which would also match it`, () => {
			expect(isQuotedOrMisquoted(`"abc"`)).toBe("quoted");
		});

	});

	describe(`returns false for everything else (tri-state, not boolean)`, () => {

		test(`empty string is falsy — short-circuited by !value`, () => {
			expect(isQuotedOrMisquoted(``)).toBe(false);
		});

		test(`undefined (Optional<string>)`, () => {
			expect(isQuotedOrMisquoted(undefined)).toBe(false);
		});

		test(`null (Optional<string>)`, () => {
			expect(isQuotedOrMisquoted(null)).toBe(false);
		});

		test(`unbalanced "abc`, () => {
			expect(isQuotedOrMisquoted(`"abc`)).toBe(false);
		});

		test(`cross-family "abc' matches neither`, () => {
			expect(isQuotedOrMisquoted(`"abc'`)).toBe(false);
		});

		test(`embedded quoted substring x"a"y fails the index/length check`, () => {
			expect(isQuotedOrMisquoted(`x"a"y`)).toBe(false);
		});

	});

});
