import { describe, expect, test } from "vitest";
import { dequote } from "../build/index.js";

describe("dequote", () => {

	describe("properly quoted values are unwrapped", () => {

		test(`dequote('""') === ""`, () => {
			expect(dequote(`""`)).toBe(``);
		});

		test(`dequote("''") strips simple singles`, () => {
			expect(dequote(`''`)).toBe(``);
		});

		test(`dequote('“”') strips fancy doubles`, () => {
			expect(dequote(`“”`)).toBe(``);
		});

		test(`dequote('‘’') strips fancy singles`, () => {
			expect(dequote(`‘’`)).toBe(``);
		});

		test(`dequote('"normal double"') === "normal double"`, () => {
			expect(dequote(`"normal double"`)).toBe(`normal double`);
		});

		test(`dequote("'normal single'") === "normal single"`, () => {
			expect(dequote(`'normal single'`)).toBe(`normal single`);
		});

		test(`dequote('“fancy double”') === "fancy double"`, () => {
			expect(dequote(`“fancy double”`)).toBe(`fancy double`);
		});

		test(`dequote('‘fancy single’') === "fancy single"`, () => {
			expect(dequote(`‘fancy single’`)).toBe(`fancy single`);
		});

		test(`mixed quote chars inside simple doubles are kept verbatim`, () => {
			expect(dequote(`"'‘“„"`)).toBe(`'‘“„`);
		});

	});

	describe("misquoted values are unwrapped too", () => {

		test(`dequote('"abc“') strips mismatched open/close doubles`, () => {
			expect(dequote(`"abc“`)).toBe(`abc`);
		});

		test(`dequote('”abc”') strips right-right fancy doubles`, () => {
			expect(dequote(`”abc”`)).toBe(`abc`);
		});

		test(`dequote("'a’") strips mismatched singles`, () => {
			expect(dequote(`'abc’`)).toBe(`abc`);
		});

	});

	describe("escaped quotes are unescaped after unwrapping", () => {

		test(`\\" inside doubles becomes a plain double quote`, () => {
			expect(dequote(`"a\\"b"`)).toBe(`a"b`);
		});

		test(`dequote of an escaped-quote-wrapped value round-trips quote()`, () => {
			expect(dequote(`"\\"simple\\""`)).toBe(`"simple"`);
		});

		test(`trailing backslash before the close quote survives unwrapping (quirk: \\\\ is not re-escaped)`, () => {
			expect(dequote(`"a\\\\"`)).toBe(`a\\\\`);
		});

	});

	describe("unquoted values pass through unchanged", () => {

		test(`dequote("") === ""`, () => {
			expect(dequote(``)).toBe(``);
		});

		test(`dequote(" ") === " "`, () => {
			expect(dequote(` `)).toBe(` `);
		});

		test(`a jumble of quote chars surrounded by spaces is untouched`, () => {
			expect(dequote(` '‘"“„ `)).toBe(` '‘"“„ `);
		});

		test(`quotes not at both ends are untouched`, () => {
			expect(dequote(` 'normal single' `)).toBe(` 'normal single' `);
		});

		test(`mismatched families ("abc') match neither quoted nor misquoted`, () => {
			expect(dequote(`"abc'`)).toBe(`"abc'`);
		});

		test(`a leading escaped quote is not treated as an open quote`, () => {
			expect(dequote(`\\"escaped"`)).toBe(`\\"escaped"`);
		});

	});

});
