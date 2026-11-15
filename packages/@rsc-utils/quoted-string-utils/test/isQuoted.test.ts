import { describe, expect, test } from "vitest";
import { isQuoted } from "../build/index.js";

describe("isQuoted", () => {

	describe("properly quoted values are true", () => {

		test(`empty simple doubles ""`, () => {
			expect(isQuoted(`""`)).toBe(true);
		});

		test(`simple doubles "simple"`, () => {
			expect(isQuoted(`"simple"`)).toBe(true);
		});

		test(`fancy doubles “fancy double”`, () => {
			expect(isQuoted(`“fancy double”`)).toBe(true);
		});

		test(`simple singles 'normal single'`, () => {
			expect(isQuoted(`'normal single'`)).toBe(true);
		});

		test(`fancy singles ‘fancy single’`, () => {
			expect(isQuoted(`‘fancy single’`)).toBe(true);
		});

		test(`a quoted space " " is quoted`, () => {
			expect(isQuoted(`" "`)).toBe(true);
		});

		test(`escaped inner quotes keep the value properly quoted`, () => {
			expect(isQuoted(`"\\"simple\\""`)).toBe(true);
		});

		test(`fancy doubles wrapping plain doubles are still quoted`, () => {
			expect(isQuoted(`“"smart"”`)).toBe(true);
		});

		test(`mixed quote chars inside simple doubles are just content`, () => {
			expect(isQuoted(`"'‘“„"`)).toBe(true);
		});

	});

	describe("everything else is false", () => {

		test(`empty string`, () => {
			expect(isQuoted(``)).toBe(false);
		});

		test(`a bare space`, () => {
			expect(isQuoted(` `)).toBe(false);
		});

		test(`undefined (Optional<string>)`, () => {
			expect(isQuoted(undefined)).toBe(false);
		});

		test(`null (Optional<string>)`, () => {
			expect(isQuoted(null)).toBe(false);
		});

		test(`misquoted "abc“ is not properly quoted`, () => {
			expect(isQuoted(`"abc“`)).toBe(false);
		});

		test(`right-right ”abc” is misquoted, not quoted`, () => {
			expect(isQuoted(`”abc”`)).toBe(false);
		});

		test(`unbalanced "abc has no close`, () => {
			expect(isQuoted(`"abc`)).toBe(false);
		});

		test(`quotes must span the whole value — x"a"y is false (index/length check)`, () => {
			expect(isQuoted(`x"a"y`)).toBe(false);
		});

		test(`quotes not at both ends are untouched content`, () => {
			expect(isQuoted(` 'normal single' `)).toBe(false);
		});

		test(`a jumble of quote chars is false`, () => {
			expect(isQuoted(` '‘"“„ `)).toBe(false);
		});

	});

});
