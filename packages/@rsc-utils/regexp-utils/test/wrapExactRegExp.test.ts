import { describe, expect, test } from "vitest";
import { wrapExactRegExp } from "../build/index.js";

describe("regex", () => {

	describe("wrapExactRegExp", () => {

		test(`wraps the source exactly, with no added whitespace`, () => {
			const regexp = wrapExactRegExp(/\d+/, `<>`);
			expect(regexp.source).toBe(`\\x3c(?:\\d+)\\x3e`);
			expect(regexp.test(`<1>`)).toBe(true);
			// unlike wrapRegExp, whitespace inside the wrap chars is not allowed
			expect(regexp.test(`< 1 >`)).toBe(false);
			expect(regexp.test(`1`)).toBe(false);
		});

		test(`keeps the flags of the given regexp`, () => {
			expect(wrapExactRegExp(/a/i, `<>`).flags).toBe(`i`);
			expect(wrapExactRegExp(/a/g, `()`).flags).toBe(`g`);
		});

		test(`returns a new instance`, () => {
			const regexp = /\d+/;
			expect(wrapExactRegExp(regexp, `<>`)).not.toBe(regexp);
		});

		test(`with optional also matches the bare regexp`, () => {
			const regexp = wrapExactRegExp(/\d+/, `<>`, { optional:true });
			expect(regexp.test(`<1>`)).toBe(true);
			expect(regexp.exec(`a 1 b`)?.[0]).toBe(`1`);
			expect(regexp.exec(`a <12> b`)?.[0]).toBe(`<12>`);
		});

		test(`without optional rejects the bare regexp`, () => {
			const regexp = wrapExactRegExp(/\d+/, `<>`);
			expect(regexp.test(`1`)).toBe(false);
			expect(regexp.exec(`a 1 b`)).toBeNull();
		});

		test(`escapes special characters in the wrap chars`, () => {
			const regexp = wrapExactRegExp(/\d+/, `()`);
			expect(regexp.source).toBe(`\\((?:\\d+)\\)`);
			expect(regexp.test(`(5)`)).toBe(true);
			expect(regexp.test(`xa5y`)).toBe(false);
		});

		test(`splits odd-length wrap chars with a mirrored right side`, () => {
			const regexp = wrapExactRegExp(/x/, `_*~`);
			expect(regexp.test(`_*~x~*_`)).toBe(true);
			expect(regexp.test(`<x>`)).toBe(false);
		});

		test(`contains top-level alternation inside the required side of optional wraps`, () => {
			const regexp = wrapExactRegExp(/\d+|\w+/, `<>`, { optional:true });
			expect(regexp.exec(`abc`)?.[0]).toBe(`abc`);
			expect(regexp.exec(`<42>`)?.[0]).toBe(`<42>`);
		});

		test(`throws for blank wrap chars`, () => {
			expect(() => wrapExactRegExp(/x/, ``)).toThrow(TypeError);
			expect(() => wrapExactRegExp(/x/, `  `)).toThrow(TypeError);
		});

	});

});
