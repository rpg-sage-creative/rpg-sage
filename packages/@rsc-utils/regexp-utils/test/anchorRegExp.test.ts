import { describe, expect, test } from "vitest";
import { anchorRegExp } from "../build/index.js";

describe("regex", () => {

	describe("anchorRegExp", () => {

		test(`wraps the source in ^(?:...)$`, () => {
			expect(anchorRegExp(/\d+/).source).toBe(`^(?:\\d+)$`);
		});

		test(`keeps the flags of the given regexp`, () => {
			expect(anchorRegExp(/a/i).flags).toBe(`i`);
			expect(anchorRegExp(/a/gi).flags).toBe(`gi`);
			expect(anchorRegExp(/a/y).flags).toBe(`y`);
		});

		test(`returns a new instance`, () => {
			const regexp = /a/;
			expect(anchorRegExp(regexp)).not.toBe(regexp);
		});

		test(`requires the entire value to match`, () => {
			const regexp = anchorRegExp(/\d+/);
			expect(regexp.test(`123`)).toBe(true);
			expect(regexp.test(`a123`)).toBe(false);
			expect(regexp.test(` 123`)).toBe(false);
			expect(regexp.test(`123 `)).toBe(false);
			expect(regexp.test(`123b`)).toBe(false);
		});

		test(`contains top-level alternation inside the anchor`, () => {
			const regexp = anchorRegExp(/a|b/);
			expect(regexp.source).toBe(`^(?:a|b)$`);
			expect(regexp.test(`a`)).toBe(true);
			expect(regexp.test(`b`)).toBe(true);
			expect(regexp.test(`ab`)).toBe(false);
			expect(regexp.test(`xb`)).toBe(false);
		});

		test(`exec only matches when the entire value matches`, () => {
			const regexp = anchorRegExp(/\d+/);
			expect(Array.from(regexp.exec(`12`)!)).toEqual([`12`]);
			expect(regexp.exec(`nothing 12 here`)).toBeNull();
			expect(regexp.exec(`nothing`)).toBeNull();
		});

	});

});
