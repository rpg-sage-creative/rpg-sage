import { describe, expect, test } from "vitest";
import { HorizontalWhitespaceRegExp, HorizontalWhitespaceRegExpG, OptionalHorizontalWhitespaceRegExp, OptionalWhitespaceRegExp, WhitespaceRegExp, WhitespaceRegExpG } from "../build/index.js";

describe("WhitespaceRegExp", () => {

	test(`matches a space`, () => {
		expect(WhitespaceRegExp.test(` `)).toBe(true);
		expect(String(WhitespaceRegExp.exec(` `))).toBe(String([` `]));
	});

	test(`matches a newline`, () => {
		expect(WhitespaceRegExp.test(`\n`)).toBe(true);
		expect(String(WhitespaceRegExp.exec(`\n`))).toBe(String([`\n`]));
	});

	test(`matches mixed whitespace runs as one match`, () => {
		expect(String(WhitespaceRegExp.exec(`b\n  \rb`))).toBe(String([`\n  \r`]));
	});

	test(`does not match non-whitespace`, () => {
		expect(WhitespaceRegExp.test(`b`)).toBe(false);
		expect(WhitespaceRegExp.exec(`b`)).toBeNull();
	});

});

describe("WhitespaceRegExpG", () => {

	test(`matches a space`, () => {
		WhitespaceRegExpG.lastIndex = 0;
		expect(String(WhitespaceRegExpG.exec(` `))).toBe(String([` `]));
	});

	test(`matches mixed whitespace runs as one match`, () => {
		WhitespaceRegExpG.lastIndex = 0;
		expect(String(WhitespaceRegExpG.exec(`b\n  \rb`))).toBe(String([`\n  \r`]));
	});

	test(`finds every whitespace run via String.match`, () => {
		expect(`a b\tc\nd`.match(WhitespaceRegExpG)).toEqual([` `, `\t`, `\n`]);
	});

	test(`is global and advances lastIndex between exec calls`, () => {
		WhitespaceRegExpG.lastIndex = 0;
		const first = WhitespaceRegExpG.exec(`a b c`);
		expect(first?.index).toBe(1);
		expect(WhitespaceRegExpG.lastIndex).toBe(2);
		const second = WhitespaceRegExpG.exec(`a b c`);
		expect(second?.index).toBe(3);
		WhitespaceRegExpG.lastIndex = 0;
	});

});

describe("OptionalWhitespaceRegExp", () => {

	test(`matches zero whitespace at the start of non-whitespace`, () => {
		const match = OptionalWhitespaceRegExp.exec(`abc`);
		expect(match?.[0]).toBe("");
		expect(match?.index).toBe(0);
	});

	test(`matches a greedy whitespace run`, () => {
		expect(OptionalWhitespaceRegExp.exec(`  \n abc`)![0]).toBe(`  \n `);
	});

});

describe("HorizontalWhitespaceRegExp", () => {

	test(`matches a space`, () => {
		expect(HorizontalWhitespaceRegExp.test(` `)).toBe(true);
	});

	test(`does not match a newline`, () => {
		expect(HorizontalWhitespaceRegExp.test(`\n`)).toBe(false);
		expect(HorizontalWhitespaceRegExp.exec(`\n`)).toBeNull();
	});

	test(`skips newlines to match the horizontal run between them`, () => {
		expect(String(HorizontalWhitespaceRegExp.exec(`b\n  \rb`))).toBe(String([`  `]));
	});

	test(`matches a tab (horizontal whitespace)`, () => {
		expect(HorizontalWhitespaceRegExp.test(`\t`)).toBe(true);
	});

	test(`only excludes carriage return and line feed, not other whitespace`, () => {
		expect(HorizontalWhitespaceRegExp.test(`\r`)).toBe(false);
		expect(HorizontalWhitespaceRegExp.test(`\f`)).toBe(true);
	});

});

describe("HorizontalWhitespaceRegExpG", () => {

	test(`matches a space`, () => {
		HorizontalWhitespaceRegExpG.lastIndex = 0;
		expect(String(HorizontalWhitespaceRegExpG.exec(` `))).toBe(String([` `]));
	});

	test(`skips newlines to match the horizontal run between them`, () => {
		HorizontalWhitespaceRegExpG.lastIndex = 0;
		expect(String(HorizontalWhitespaceRegExpG.exec(`b\n  \rb`))).toBe(String([`  `]));
	});

	test(`finds every horizontal run via String.match, skipping newlines`, () => {
		expect(`a b\nc d`.match(HorizontalWhitespaceRegExpG)).toEqual([` `, ` `]);
	});

});

describe("OptionalHorizontalWhitespaceRegExp", () => {

	test(`matches zero horizontal whitespace before a newline`, () => {
		const match = OptionalHorizontalWhitespaceRegExp.exec(`\nabc`);
		expect(match?.[0]).toBe("");
		expect(match?.index).toBe(0);
	});

	test(`matches a greedy horizontal run`, () => {
		expect(OptionalHorizontalWhitespaceRegExp.exec(` \t x`)![0]).toBe(` \t `);
	});

});
