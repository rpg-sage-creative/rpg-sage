import { globalizeRegExp } from "@rsc-utils/regexp-utils";
import { describe, expect, test } from "vitest";
import { AnimatedDiscordEmojiRegExp, DiscordEmojiRegExp, NonAnimatedDiscordEmojiRegExp } from "../../build/index.js";

describe("emoji", () => {

	describe("DiscordEmojiRegExp", () => {

		test(`does not match unicode emoji`, () => {
			expect(DiscordEmojiRegExp.test(`one 💯 hundred`)).toBe(false);
			expect(DiscordEmojiRegExp.exec(`one 💯 hundred`)).toBeNull();
		});

		test(`matches a non-animated discord emoji`, () => {
			const input = `sage <:sage_heart_eyes:1159195747745538140> eyes`;
			expect(DiscordEmojiRegExp.test(input)).toBe(true);
			expect(String(DiscordEmojiRegExp.exec(input))).toBe(`<:sage_heart_eyes:1159195747745538140>`);
		});

		test(`matches an animated discord emoji`, () => {
			const input = `sage <a:sage_heart_eyes:1159195747745538140> eyes`;
			expect(DiscordEmojiRegExp.test(input)).toBe(true);
			expect(String(DiscordEmojiRegExp.exec(input))).toBe(`<a:sage_heart_eyes:1159195747745538140>`);
		});

		test(`finds every discord emoji with a global clone`, () => {
			const input = `one <:first_heart:1159195747745538140> two <a:second_heart:1159195747745538141>`;
			expect(String(input.match(globalizeRegExp(DiscordEmojiRegExp)))).toBe(`<:first_heart:1159195747745538140>,<a:second_heart:1159195747745538141>`);
		});

	});

	describe("AnimatedDiscordEmojiRegExp", () => {

		test(`matches only animated emoji`, () => {
			expect(AnimatedDiscordEmojiRegExp.test(`<a:sage_heart_eyes:1159195747745538140>`)).toBe(true);
			expect(AnimatedDiscordEmojiRegExp.test(`<:sage_heart_eyes:1159195747745538140>`)).toBe(false);
		});

	});

	describe("NonAnimatedDiscordEmojiRegExp", () => {

		test(`matches only non-animated emoji`, () => {
			expect(NonAnimatedDiscordEmojiRegExp.test(`<:sage_heart_eyes:1159195747745538140>`)).toBe(true);
			expect(NonAnimatedDiscordEmojiRegExp.test(`<a:sage_heart_eyes:1159195747745538140>`)).toBe(false);
		});

	});

});
