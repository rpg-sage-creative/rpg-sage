import { describe, expect, test } from "vitest";
import { quote } from "../build/index.js";

describe("quote", () => {

	describe("default style (double)", () => {

		test(`quote("") === '""'`, () => {
			expect(quote("")).toBe(`""`);
		});

		test(`quote(" ") === '" "'`, () => {
			expect(quote(" ")).toBe(`" "`);
		});

		test(`quote("simple") wraps in double quotes`, () => {
			expect(quote(`simple`)).toBe(`"simple"`);
		});

		test(`explicit style "double" matches the default`, () => {
			expect(quote(`simple`, `double`)).toBe(`"simple"`);
		});

		test(`plain double quotes in the value are escaped`, () => {
			expect(quote(`"simple"`)).toBe(`"\\"simple\\""`);
		});

		test(`fancy double quotes pass through unescaped`, () => {
			expect(quote(`sim“”ple`)).toBe(`"sim“”ple"`);
		});

		test(`german low quotes pass through unescaped`, () => {
			expect(quote(`sim„“ple`)).toBe(`"sim„“ple"`);
		});

		test(`plain single quotes pass through unescaped in double style`, () => {
			expect(quote(`sim''ple`)).toBe(`"sim''ple"`);
		});

		test(`embedded double-quoted words are escaped`, () => {
			expect(quote(`simple "with" quotes`)).toBe(`"simple \\"with\\" quotes"`);
		});

		test(`already-escaped inner doubles get their backslashes escaped too`, () => {
			expect(quote(`simple "with \\"double\\"" quotes`)).toBe(`"simple \\"with \\\\"double\\\\"\\" quotes"`);
		});

		test(`a lone embedded double quote is escaped`, () => {
			expect(quote(` " `)).toBe(`" \\" "`);
		});

		test(`nested escaping compounds one level deeper`, () => {
			expect(quote(` " \\" " `)).toBe(`" \\" \\\\" \\" "`);
		});

		test(`triple nested escaping compounds again`, () => {
			expect(quote(` " \\" \\\\\\" \\" " `)).toBe(`" \\" \\\\" \\\\\\\\" \\\\" \\" "`);
		});

	});

	describe("style: single", () => {

		test(`wraps in plain single quotes`, () => {
			expect(quote(`simple`, `single`)).toBe(`'simple'`);
		});

		test(`plain single quotes in the value are escaped`, () => {
			expect(quote(`'simple'`, `single`)).toBe(`'\\'simple\\''`);
		});

		test(`embedded single-quoted words are escaped`, () => {
			expect(quote(`simple 'with' quotes`, `single`)).toBe(`'simple \\'with\\' quotes'`);
		});

	});

	describe("style: smart", () => {

		test(`without plain double quotes in the value, behaves like "double" (quirk: only reacts to ")`, () => {
			expect(quote(`simple`, `smart`)).toBe(`"simple"`);
		});

		test(`single-quoted values are NOT detected — still wrapped in escaped-free doubles`, () => {
			expect(quote(`'simple'`, `smart`)).toBe(`"'simple'"`);
		});

		test(`fancy-double-quoted values are NOT detected either`, () => {
			expect(quote(`a“b”`, `smart`)).toBe(`"a“b”"`);
		});

		test(`with a plain double quote and no fancy doubles, wraps in fancy doubles unescaped`, () => {
			expect(quote(`"smart"`, `smart`)).toBe(`“"smart"”`);
		});

		test(`fancy doubles present but no plain single quotes: falls back to simple singles`, () => {
			expect(quote(`a"“b`, `smart`)).toBe(`'a"“b'`);
		});

		test(`plain double + fancy double + plain single, no fancy singles: wraps in fancy singles`, () => {
			expect(quote(`a"'“b`, `smart`)).toBe(`‘a"'“b’`);
		});

		test(`every quote type present falls through to escaped doubles`, () => {
			expect(quote(`a"b'c“d”e‘f’g`, `smart`)).toBe(`"a\\"b'c“d”e‘f’g"`);
		});

	});

});
