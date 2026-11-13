import { captureRegExp, globalizeRegExp } from "@rsc-utils/regexp-utils";
import { describe, expect, test } from "vitest";
import { UnicodeEmojiRegExp } from "../../build/index.js";

describe("emoji", () => {

	describe("UnicodeEmojiRegExp", () => {

		test(`matches a unicode emoji in text`, () => {
			expect(UnicodeEmojiRegExp.test(`one 💯 hundred`)).toBe(true);
			expect(String(UnicodeEmojiRegExp.exec(`one 💯 hundred`))).toBe(`💯`);
		});

		test(`does not match discord emoji syntax as one token`, () => {
			// the unicode regex matches nothing here; <:...:> is not a unicode emoji
			expect(UnicodeEmojiRegExp.test(`<:sage_heart_eyes:1159195747745538140>`)).toBe(false);
		});

		test(`matches consecutive emoji once each by default`, () => {
			const input = `one 💯💯 hundred 💯`;
			expect(String(input.match(globalizeRegExp(UnicodeEmojiRegExp)))).toBe(`💯,💯,💯`);
		});

		test(`a quantified clone matches consecutive emoji as one run`, () => {
			const quantified = new RegExp(`(?:${UnicodeEmojiRegExp.source})+`, UnicodeEmojiRegExp.flags);
			const input = `one 💯💯 hundred 💯`;
			expect(String(input.match(globalizeRegExp(quantified)))).toBe(`💯💯,💯`);
		});

		test(`a quantified clone requiring three does not match a pair`, () => {
			const quantified = new RegExp(`(?:${UnicodeEmojiRegExp.source}){3,}`, UnicodeEmojiRegExp.flags);
			expect(quantified.test(`one 💯💯 hundred 💯`)).toBe(false);
		});

		test(`a captured clone exposes the emoji as a named group`, () => {
			const captured = captureRegExp(UnicodeEmojiRegExp, `emoji`);
			expect(captured.exec(`one 💯 hundred`)?.groups?.emoji).toBe(`💯`);
		});

	});

});
