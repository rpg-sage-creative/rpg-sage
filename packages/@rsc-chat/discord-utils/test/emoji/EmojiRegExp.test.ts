import { captureRegExp, globalizeRegExp } from "@rsc-utils/regexp-utils";
import { describe, expect, test } from "vitest";
import { EmojiRegExp } from "../../build/index.js";

describe("emoji", () => {

	describe("EmojiRegExp", () => {

		test(`matches a unicode emoji in text`, () => {
			expect(EmojiRegExp.test(`one 💯 hundred`)).toBe(true);
			expect(String(EmojiRegExp.exec(`one 💯 hundred`))).toBe(`💯`);
		});

		test(`matches a non-animated discord emoji`, () => {
			const input = `sage <:sage_heart_eyes:1159195747745538140> eyes`;
			expect(EmojiRegExp.test(input)).toBe(true);
			expect(String(EmojiRegExp.exec(input))).toBe(`<:sage_heart_eyes:1159195747745538140>`);
		});

		test(`matches an animated discord emoji`, () => {
			const input = `sage <a:sage_heart_eyes:1159195747745538140> eyes`;
			expect(EmojiRegExp.test(input)).toBe(true);
			expect(String(EmojiRegExp.exec(input))).toBe(`<a:sage_heart_eyes:1159195747745538140>`);
		});

		test(`finds every emoji with a global clone`, () => {
			const input = `one 💯💯 hundred 💯`;
			expect(String(input.match(globalizeRegExp(EmojiRegExp)))).toBe(`💯,💯,💯`);
		});

		test(`a quantified clone matches consecutive emoji as one run`, () => {
			const quantified = new RegExp(`(?:${EmojiRegExp.source})+`, EmojiRegExp.flags);
			const input = `one 💯💯 hundred 💯`;
			expect(String(input.match(globalizeRegExp(quantified)))).toBe(`💯💯,💯`);
		});

		test(`a quantified clone requiring three does not match a pair`, () => {
			const quantified = new RegExp(`(?:${EmojiRegExp.source}){3,}`, EmojiRegExp.flags);
			expect(quantified.test(`one 💯💯 hundred 💯`)).toBe(false);
		});

		test(`a captured clone exposes the emoji as a named group`, () => {
			const captured = captureRegExp(EmojiRegExp, `emoji`);
			expect(captured.exec(`one 💯 hundred`)?.groups?.emoji).toBe(`💯`);
		});

	});

});
