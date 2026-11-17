import { describe, expect, test } from "vitest";
import { toCircledLetter } from "../build/index.js";

// within each block the mapping is linear code-point arithmetic (circleA + charCode - delta),
// so boundary letters prove the formula for every letter between them — see TESTS-PROGRESS.md
describe("toCircledLetter", () => {

	describe("uppercase block Ⓐ-Ⓩ", () => {

		test(`"A" is the first circled uppercase`, () => {
			expect(toCircledLetter("A")).toBe(`Ⓐ`);
		});

		test(`interior letter "M" maps by delta`, () => {
			expect(toCircledLetter("M")).toBe(`Ⓜ`);
		});

		test(`"Z" is the last circled uppercase`, () => {
			expect(toCircledLetter("Z")).toBe(`Ⓩ`);
		});

	});

	describe("lowercase block ⓐ-ⓩ", () => {

		test(`"a" is the first circled lowercase`, () => {
			expect(toCircledLetter("a")).toBe(`ⓐ`);
		});

		test(`interior letter "m" maps by delta`, () => {
			expect(toCircledLetter("m")).toBe(`ⓜ`);
		});

		test(`"z" is the last circled lowercase`, () => {
			expect(toCircledLetter("z")).toBe(`ⓩ`);
		});

	});

	describe("negative (white on black) variants", () => {

		test(`uppercase "A" with negative:true starts the 🅐-🅩 block`, () => {
			expect(toCircledLetter("A", { negative:true })).toBe(`🅐`);
		});

		test(`uppercase "Z" with negative:true ends the block`, () => {
			expect(toCircledLetter("Z", { negative:true })).toBe(`🅩`);
		});

		test(`negative lowercase returns "" — no such code points exist`, () => {
			expect(toCircledLetter("a", { negative:true })).toBe(``);
		});

		test(`negative:false explicitly behaves like the default`, () => {
			expect(toCircledLetter("A", { negative:false })).toBe(`Ⓐ`);
		});

	});

	describe("quirks and errors", () => {

		test(`multi-character input uses only the first character (quirk)`, () => {
			expect(toCircledLetter("ab")).toBe(`ⓐ`);
		});

		test(`empty string throws RangeError`, () => {
			expect(() => toCircledLetter(``)).toThrow(RangeError);
		});

		test(`space throws RangeError`, () => {
			expect(() => toCircledLetter(` `)).toThrow(RangeError);
		});

		test(`digit "1" throws RangeError`, () => {
			expect(() => toCircledLetter(`1`)).toThrow(RangeError);
		});

		test(`non-string input throws TypeError (charCodeAt is not a function), not the guarded RangeError`, () => {
			expect(() => toCircledLetter(1 as unknown as string)).toThrow(TypeError);
		});

		test(`null throws`, () => {
			expect(() => toCircledLetter(null as unknown as string)).toThrow();
		});

		test(`undefined throws`, () => {
			expect(() => toCircledLetter(undefined as unknown as string)).toThrow();
		});

	});

});
