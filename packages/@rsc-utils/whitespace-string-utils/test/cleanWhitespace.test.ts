import { describe, expect, test } from "vitest";
import { cleanWhitespace } from "../build/index.js";

describe("cleanWhitespace", () => {

	describe("falsy input is returned as-is", () => {

		test(`cleanWhitespace(null) === null`, () => {
			expect(cleanWhitespace(null)).toBe(null);
		});

		test(`cleanWhitespace(undefined) === undefined`, () => {
			expect(cleanWhitespace(undefined)).toBe(undefined);
		});

		test(`cleanWhitespace("") === ""`, () => {
			expect(cleanWhitespace("")).toBe("");
		});

	});

	describe("default options", () => {

		test(`cleanWhitespace("mud") === "mud" (no whitespace to clean)`, () => {
			expect(cleanWhitespace(`mud`)).toBe(`mud`);
		});

		test(`adjacent spaces are reduced to a single space and trimmed`, () => {
			expect(cleanWhitespace(` m u d `)).toBe(`m u d`);
			expect(cleanWhitespace(` m  u  d `)).toBe(`m u d`);
			expect(cleanWhitespace(` m  u   d `)).toBe(`m u d`);
		});

		test(`newlines and carriage returns are replaced with a space`, () => {
			expect(cleanWhitespace(` m\nu\rd `)).toBe(`m u d`);
		});

		test(`tabs are replaced with a space`, () => {
			expect(cleanWhitespace(` m\tu\nd `)).toBe(`m u d`);
		});

		test(`unicode whitespace is collapsed (\\f, \\v)`, () => {
			expect(cleanWhitespace(`a\f\vb`)).toBe(`a b`);
		});

		test(`non-breaking space and line separators are whitespace to \\s`, () => {
			expect(cleanWhitespace(`a\u00a0\u00a0b`)).toBe(`a b`);
			expect(cleanWhitespace(`a\u2028\u2028b`)).toBe(`a b`);
		});

		test(`whitespace-only input becomes an empty string after trim`, () => {
			expect(cleanWhitespace(`   `)).toBe("");
			expect(cleanWhitespace(`\t\t`)).toBe("");
		});

		test(`leading/trailing newlines are removed by the final trim`, () => {
			expect(cleanWhitespace(`\nm\n`)).toBe(`m`);
		});

	});

	describe("replacement option", () => {

		test(`cleanWhitespace(" m  u   d ", { replacement:"\\t" })`, () => {
			expect(cleanWhitespace(` m  u   d `, { replacement:`\t` })).toBe(`m\tu\td`);
		});

		test(`cleanWhitespace(" m  u   d ", { replacement:"" }) removes all whitespace`, () => {
			expect(cleanWhitespace(` m  u   d `, { replacement:`` })).toBe(`mud`);
		});

		test(`replacement applies to newlines by default`, () => {
			expect(cleanWhitespace(` m\nu\rd `, { replacement:`\t` })).toBe(`m\tu\td`);
		});

		test(`a non-whitespace replacement survives the final trim`, () => {
			expect(cleanWhitespace(` a  b `, { replacement:`-` })).toBe(`-a-b-`);
		});

	});

	describe("horizontalOnly option", () => {

		test(`cleanWhitespace(" m\\nu\\rd ", { horizontalOnly:true }) keeps newlines`, () => {
			expect(cleanWhitespace(` m\nu\rd `, { horizontalOnly:true })).toBe(`m\nu\rd`);
		});

		test(`horizontalOnly still replaces tabs`, () => {
			expect(cleanWhitespace(` m\tu\nd `, { horizontalOnly:true })).toBe(`m u\nd`);
		});

		test(`horizontalOnly still collapses non-breaking spaces`, () => {
			expect(cleanWhitespace(`a\u00a0\u00a0b`, { horizontalOnly:true })).toBe(`a b`);
		});

		test(`horizontalOnly with replacement only replaces horizontal whitespace`, () => {
			expect(cleanWhitespace(` m \n u `, { horizontalOnly:true, replacement:`-` })).toBe(`-m-\n-u-`);
		});

		test(`horizontalOnly still trims leading/trailing newlines`, () => {
			expect(cleanWhitespace(`\nm\n`, { horizontalOnly:true })).toBe(`m`);
		});

	});

});
