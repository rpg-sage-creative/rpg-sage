import { describe, expect, test } from "vitest";
import { getOrCreateRegExp, type RegExpGetOptions } from "../build/index.js";

type CreateRegExpFunction<T extends RegExpGetOptions, U extends RegExp> = (options?: T) => U;

describe("getOrCreateRegExp", () => {

	describe("control tests", () => {
		test(`#1: create valid regex from string`, () => {
			let regex: RegExp | undefined;
			expect(() => regex = new RegExp(`(?<first>second)`)).not.toThrow();
			expect(regex).toBeDefined();
			expect(regex?.source).toBe(`(?<first>second)`);
			expect(regex?.flags).toBe("");
		});

		test(`#2: create invalid regex from string; throw`, () => {
			let regex: RegExp | undefined;
			expect(() => regex = new RegExp(`(?<first>second) (?<first>second)`)).toThrow("Invalid regular expression: /(?<first>second) (?<first>second)/: Duplicate capture group name");
			expect(regex).toBeUndefined();
		});
	});

	describe("unit tests", () => {
		test(`#1: getOrCreateRegExp safely creates optional spoiler regex from valid regex`, () => {
			let regex: RegExp | undefined;
			expect(() => regex = getOrCreateRegExp(function unitTest1() { return /(?<first>second)/i; }, { spoilers:"optional" })).not.toThrow();
			expect(regex?.source).toBe(`(?:\\|\\|(?:(?<first>second))\\|\\|)|(?:(?<first>second))`);
			expect(regex?.flags).toBe("i");
		});

		test(`#2: getOrCreateRegExp safely creates regex when creator creates invalid regex with duplicate capture groups`, () => {
			let regex: RegExp | undefined;
			expect(() => regex = getOrCreateRegExp(function unitTest2() { return new RegExp(`(?<first>second) (?<first>second)`, "iv"); })).toThrow("Invalid regular expression: /(?<first>second) (?<first>second)/iv: Duplicate capture group name");
			expect(regex).toBeUndefined();
		});

		test(`#3: getOrCreateRegExp safely creates optional spoiler regex when creator creates invalid regex with duplicate capture groups`, () => {
			let regex: RegExp | undefined;
			expect(() => regex = getOrCreateRegExp(function unitTest3() { return new RegExp(`(?<first>second) (?<first1>second)`, "iv"); }, { spoilers:"optional" })).not.toThrow();
			expect(regex).toBeDefined();
			expect(regex?.source).toBe(`(?:\\|\\|(?:(?<first>second) (?<first1>second))\\|\\|)|(?:(?<first>second) (?<first1>second))`);
		});

		test(`#4: getOrCreateRegExp caches correctly`, () => {
			const creator = function({ gFlag = "", iFlag = "" }) {
				return new RegExp("simple", gFlag + iFlag);
			} as CreateRegExpFunction<any, any>;

			const [
				first, second, third, fourth, fifth, sixth, seventh, eighth
			] = [
				{}, {}, {iFlag:"i"}, {iFlag:"i"}, {gFlag:"g"}, {gFlag:"g"}, {gFlag:"g"}, {gFlag:"g"}
			].map((flags, i) => getOrCreateRegExp(creator, flags, i > 5 as true));

			expect(first === second).toBe(true);
			expect(second !== third).toBe(true);
			expect(third === fourth).toBe(true);
			expect(fourth !== fifth).toBe(true);
			expect(fifth !== sixth).toBe(true);
			expect(sixth !== seventh).toBe(true);
			expect(seventh === eighth).toBe(true);
		});

	});

});