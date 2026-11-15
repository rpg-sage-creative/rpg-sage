import { describe, expect, test } from "vitest";
import { MisquotedNumberRegExp } from "../build/index.js";

describe("MisquotedNumberRegExp", () => {

	describe("matches numbers in mismatched pairs", () => {

		test(`simple open with fancy close "42“`, () => {
			expect(MisquotedNumberRegExp.exec(`"42“`)?.[0]).toBe(`"42“`);
		});

		test(`fancy-right open with simple close ”42"`, () => {
			expect(MisquotedNumberRegExp.exec(`”42"`)?.[0]).toBe(`”42"`);
		});

		test(`mismatched singles '42’`, () => {
			expect(MisquotedNumberRegExp.exec(`'42’`)?.[0]).toBe(`'42’`);
		});

	});

	describe("quirk: matching pairs are not excluded", () => {

		test(`properly quoted "42" also matches — callers must check proper quoting first`, () => {
			expect(MisquotedNumberRegExp.exec(`"42"`)?.[0]).toBe(`"42"`);
		});

	});

	describe("non-matches", () => {

		test(`non-numeric content "abc“ fails`, () => {
			expect(MisquotedNumberRegExp.exec(`"abc“`)).toBeNull();
		});

		test(`unbalanced "42 has no close`, () => {
			expect(MisquotedNumberRegExp.exec(`"42`)).toBeNull();
		});

	});

});
