import { describe, expect, test } from "vitest";
import { isMisquoted } from "../build/index.js";

describe("isMisquoted", () => {

	describe("mismatched double-quote families are true", () => {

		test(`simple open with fancy close "abc“`, () => {
			expect(isMisquoted(`"abc“`)).toBe(true);
		});

		test(`fancy open with simple close “abc"`, () => {
			expect(isMisquoted(`“abc"`)).toBe(true);
		});

		test(`right-right fancy doubles ”abc”`, () => {
			expect(isMisquoted(`”abc”`)).toBe(true);
		});

	});

	describe("mismatched single-quote families are true", () => {

		test(`simple open with fancy close 'abc’`, () => {
			expect(isMisquoted(`'abc’`)).toBe(true);
		});

		test(`right-left fancy singles ’a‘`, () => {
			expect(isMisquoted(`’a‘`)).toBe(true);
		});

	});

	describe(`properly quoted values are false (checked as "quoted" first)`, () => {

		test(`simple doubles "abc"`, () => {
			expect(isMisquoted(`"abc"`)).toBe(false);
		});

		test(`fancy doubles “abc”`, () => {
			expect(isMisquoted(`“abc”`)).toBe(false);
		});

		test(`simple singles 'abc'`, () => {
			expect(isMisquoted(`'abc'`)).toBe(false);
		});

		test(`fancy singles ‘abc’`, () => {
			expect(isMisquoted(`‘abc’`)).toBe(false);
		});

	});

	describe("everything else is false", () => {

		test(`empty string`, () => {
			expect(isMisquoted(``)).toBe(false);
		});

		test(`undefined (Optional<string>)`, () => {
			expect(isMisquoted(undefined)).toBe(false);
		});

		test(`null (Optional<string>)`, () => {
			expect(isMisquoted(null)).toBe(false);
		});

		test(`unbalanced "abc has no close`, () => {
			expect(isMisquoted(`"abc`)).toBe(false);
		});

		test(`cross-family mismatch "abc' is neither quoted nor misquoted`, () => {
			expect(isMisquoted(`"abc'`)).toBe(false);
		});

		test(`quotes must span the whole value — x"a“y is false`, () => {
			expect(isMisquoted(`x"a“y`)).toBe(false);
		});

	});

});
