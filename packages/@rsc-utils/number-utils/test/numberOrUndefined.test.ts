import { describe, expect, test } from "vitest";
import { numberOrUndefined } from "../build/index.js";

describe("numberOrUndefined", () => {

	describe("finite numbers pass through", () => {

		test(`-1 → -1`, () => {
			expect(numberOrUndefined(-1)).toBe(-1);
		});

		test(`-0.000001 → -0.000001`, () => {
			expect(numberOrUndefined(-0.000001)).toBe(-0.000001);
		});

		test(`0 → 0`, () => {
			expect(numberOrUndefined(0)).toBe(0);
		});

		test(`0.000001 → 0.000001`, () => {
			expect(numberOrUndefined(0.000001)).toBe(0.000001);
		});

		test(`1 → 1`, () => {
			expect(numberOrUndefined(1)).toBe(1);
		});

		test(`negative zero keeps its sign (isFiniteNumber lets it through)`, () => {
			expect(Object.is(numberOrUndefined(-0), -0)).toBe(true);
		});

	});

	describe("non-finite numbers yield undefined", () => {

		test(`NaN → undefined`, () => {
			expect(numberOrUndefined(NaN)).toBe(undefined);
		});

		test(`Infinity → undefined`, () => {
			expect(numberOrUndefined(Infinity)).toBe(undefined);
		});

		test(`-Infinity → undefined`, () => {
			expect(numberOrUndefined(-Infinity)).toBe(undefined);
		});

	});

	describe("non-number, non-string values yield undefined", () => {

		test(`null → undefined`, () => {
			expect(numberOrUndefined(null)).toBe(undefined);
		});

		test(`undefined → undefined`, () => {
			expect(numberOrUndefined(undefined)).toBe(undefined);
		});

		test(`true → undefined (no boolean coercion)`, () => {
			expect(numberOrUndefined(true)).toBe(undefined);
		});

		test(`false → undefined`, () => {
			expect(numberOrUndefined(false)).toBe(undefined);
		});

		test(`object → undefined`, () => {
			expect(numberOrUndefined({})).toBe(undefined);
		});

		test(`array → undefined (even a numeric one — no [1] → 1 coercion)`, () => {
			expect(numberOrUndefined([1])).toBe(undefined);
		});

		test(`function → undefined`, () => {
			expect(numberOrUndefined(() => 1)).toBe(undefined);
		});

		test(`bigint → undefined (not a number and not a string)`, () => {
			expect(numberOrUndefined(10n)).toBe(undefined);
		});

	});

	describe("number strings are cast", () => {

		test(`"-1" → -1`, () => {
			expect(numberOrUndefined("-1")).toBe(-1);
		});

		test(`"-0.000001" → -0.000001`, () => {
			expect(numberOrUndefined("-0.000001")).toBe(-0.000001);
		});

		test(`"0" → 0`, () => {
			expect(numberOrUndefined("0")).toBe(0);
		});

		test(`"0.000001" → 0.000001`, () => {
			expect(numberOrUndefined("0.000001")).toBe(0.000001);
		});

		test(`"1" → 1`, () => {
			expect(numberOrUndefined("1")).toBe(1);
		});

		test(`"+1" → 1 (leading plus is accepted)`, () => {
			expect(numberOrUndefined("+1")).toBe(1);
		});

		test(`"-0" casts to negative zero, not +0`, () => {
			expect(Object.is(numberOrUndefined("-0"), -0)).toBe(true);
		});

	});

	describe("strings the strict number regex rejects", () => {

		test(`"null" → undefined`, () => {
			expect(numberOrUndefined("null")).toBe(undefined);
		});

		test(`"undefined" → undefined`, () => {
			expect(numberOrUndefined("undefined")).toBe(undefined);
		});

		test(`"NaN" → undefined (the regex is stricter than Number())`, () => {
			expect(numberOrUndefined("NaN")).toBe(undefined);
		});

		test(`"Infinity" → undefined`, () => {
			expect(numberOrUndefined("Infinity")).toBe(undefined);
		});

		test(`".5" → undefined (no bare leading dot)`, () => {
			expect(numberOrUndefined(".5")).toBe(undefined);
		});

		test(`"1." → undefined (no bare trailing dot)`, () => {
			expect(numberOrUndefined("1.")).toBe(undefined);
		});

		test(`"1e3" → undefined (exponent notation is not a number string here)`, () => {
			expect(numberOrUndefined("1e3")).toBe(undefined);
		});

		test(`"0x10" → undefined (no hex)`, () => {
			expect(numberOrUndefined("0x10")).toBe(undefined);
		});

		test(`" +1 " → undefined — the regex is anchored, surrounding whitespace fails it`, () => {
			expect(numberOrUndefined(" +1 ")).toBe(undefined);
		});

		test(`" 1 " → undefined`, () => {
			expect(numberOrUndefined(" 1 ")).toBe(undefined);
		});

		test(`"" → undefined`, () => {
			expect(numberOrUndefined("")).toBe(undefined);
		});

		test(`" " → undefined`, () => {
			expect(numberOrUndefined(" ")).toBe(undefined);
		});

	});

});
