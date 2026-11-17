import { describe, expect, test } from "vitest";
import { toCircledNumber } from "../build/index.js";

// each option path is linear code-point arithmetic within its blocks, so boundary values prove the formula — see TESTS-PROGRESS.md
describe("toCircledNumber", () => {

	describe("plain circled numbers (0-50)", () => {

		test(`negative input returns ""`, () => {
			expect(toCircledNumber(-1)).toBe(``);
		});

		test(`0 is the special first code point ⓪`, () => {
			expect(toCircledNumber(0)).toBe(`⓪`);
		});

		test(`1 starts the ①-⑳ block`, () => {
			expect(toCircledNumber(1)).toBe(`①`);
		});

		test(`interior value "5" maps by delta`, () => {
			expect(toCircledNumber(5)).toBe(`⑤`);
		});

		test(`20 ends the first block`, () => {
			expect(toCircledNumber(20)).toBe(`⑳`);
		});

		test(`21 starts the ㉑-㉟ block (code point jump)`, () => {
			expect(toCircledNumber(21)).toBe(`㉑`);
		});

		test(`35 ends the second block`, () => {
			expect(toCircledNumber(35)).toBe(`㉟`);
		});

		test(`36 starts the ㊱-㊿ block (another jump)`, () => {
			expect(toCircledNumber(36)).toBe(`㊱`);
		});

		test(`50 is the last supported value ㊿`, () => {
			expect(toCircledNumber(50)).toBe(`㊿`);
		});

		test(`51 returns "" (out of range)`, () => {
			expect(toCircledNumber(51)).toBe(``);
		});

	});

	describe("negative circled numbers (0-20)", () => {

		test(`0 is ⓿, its own code point`, () => {
			expect(toCircledNumber(0, { negative:true })).toBe(`⓿`);
		});

		test(`1 starts the ❶-❿ block`, () => {
			expect(toCircledNumber(1, { negative:true })).toBe(`❶`);
		});

		test(`10 ends that block`, () => {
			expect(toCircledNumber(10, { negative:true })).toBe(`❿`);
		});

		test(`11 starts the ⓫-⓴ block (jump back to Enclosed Alphanumerics)`, () => {
			expect(toCircledNumber(11, { negative:true })).toBe(`⓫`);
		});

		test(`20 is the last negative circled number`, () => {
			expect(toCircledNumber(20, { negative:true })).toBe(`⓴`);
		});

		test(`21 returns "" (negative only goes to 20)`, () => {
			expect(toCircledNumber(21, { negative:true })).toBe(``);
		});

	});

	describe("double circled numbers (1-10 only)", () => {

		test(`0 has no double variant`, () => {
			expect(toCircledNumber(0, { double:true })).toBe(``);
		});

		test(`1 starts the ⓵-⓾ block`, () => {
			expect(toCircledNumber(1, { double:true })).toBe(`⓵`);
		});

		test(`10 ends it`, () => {
			expect(toCircledNumber(10, { double:true })).toBe(`⓾`);
		});

		test(`11 returns "" (double only goes to 10)`, () => {
			expect(toCircledNumber(11, { double:true })).toBe(``);
		});

		test(`double combined with dingbat returns "" — options are exclusive`, () => {
			expect(toCircledNumber(1, { double:true, dingbat:true })).toBe(``);
		});

		test(`double combined with negative returns ""`, () => {
			expect(toCircledNumber(1, { double:true, negative:true })).toBe(``);
		});

	});

	describe("dingbat circled numbers (0-10)", () => {

		test(`0 is the dingbat zero 🄋`, () => {
			expect(toCircledNumber(0, { dingbat:true })).toBe(`🄋`);
		});

		test(`1 starts the ➀-➉ block`, () => {
			expect(toCircledNumber(1, { dingbat:true })).toBe(`➀`);
		});

		test(`10 ends it`, () => {
			expect(toCircledNumber(10, { dingbat:true })).toBe(`➉`);
		});

		test(`11 returns "" (dingbat only goes to 10)`, () => {
			expect(toCircledNumber(11, { dingbat:true })).toBe(``);
		});

		describe("negative dingbats", () => {

			test(`0 is the negative dingbat zero 🄌`, () => {
				expect(toCircledNumber(0, { dingbat:true, negative:true })).toBe(`🄌`);
			});

			test(`1 starts the ➊-➓ block`, () => {
				expect(toCircledNumber(1, { dingbat:true, negative:true })).toBe(`➊`);
			});

			test(`10 ends it`, () => {
				expect(toCircledNumber(10, { dingbat:true, negative:true })).toBe(`➓`);
			});

			test(`11 returns ""`, () => {
				expect(toCircledNumber(11, { dingbat:true, negative:true })).toBe(``);
			});

		});

	});

	describe("string coercion follows @rsc-utils/number-utils numberOrUndefined", () => {

		test(`"3" is accepted`, () => {
			expect(toCircledNumber(`3`)).toBe(`③`);
		});

		test(`"+5" (plus form) is accepted as 5`, () => {
			expect(toCircledNumber(`+5`)).toBe(`⑤`);
		});

		test(`leading-zero "05" is accepted as 5 (lenient — regex-based numberOrUndefined, not canonical-form strict)`, () => {
			expect(toCircledNumber(`05`)).toBe(`⑤`);
		});

		test(`"-0" parses to zero and circles as ⓪ (quirk of lenient coercion)`, () => {
			expect(toCircledNumber(`-0`)).toBe(`⓪`);
		});

		test(`padded " 5" throws TypeError`, () => {
			expect(() => toCircledNumber(` 5`)).toThrow(TypeError);
		});

		test(`non-numeric string throws TypeError`, () => {
			expect(() => toCircledNumber(`one`)).toThrow(TypeError);
		});

		test(`empty string throws TypeError`, () => {
			expect(() => toCircledNumber(``)).toThrow(TypeError);
		});

		test(`NaN throws TypeError (non-finite numbers rejected)`, () => {
			expect(() => toCircledNumber(NaN)).toThrow(TypeError);
		});

		test(`boolean throws TypeError`, () => {
			expect(() => toCircledNumber(true as unknown as string)).toThrow(TypeError);
		});

		test(`null throws TypeError`, () => {
			expect(() => toCircledNumber(null as unknown as string)).toThrow(TypeError);
		});

		test(`undefined throws TypeError`, () => {
			expect(() => toCircledNumber(undefined as unknown as string)).toThrow(TypeError);
		});

	});

	describe("quirks", () => {

		test(`non-integer in range throws RangeError from String.fromCodePoint, not the guarded TypeError (quirk)`, () => {
			expect(() => toCircledNumber(2.5)).toThrow(RangeError);
		});

	});

});
