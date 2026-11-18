import { describe, expect, test } from "vitest";
import { round } from "../build/index.js";

describe("round", () => {

	describe("decimal places", () => {

		test(`decimals defaults to 0 — 1.000999 → 1`, () => {
			expect(round(1.000999)).toBe(1);
		});

		test(`explicit 0 decimals matches the default — 1.000999 → 1`, () => {
			expect(round(1.000999, 0)).toBe(1);
		});

		test(`1.9999 → 2 (default decimals)`, () => {
			expect(round(1.9999)).toBe(2);
		});

		test(`1.9999 with explicit 0 → 2`, () => {
			expect(round(1.9999, 0)).toBe(2);
		});

		test(`4 decimals — 1.000999 → 1.001`, () => {
			expect(round(1.000999, 4)).toBe(1.001);
		});

		test(`5 decimals — 1.000666 → 1.00067`, () => {
			expect(round(1.000666, 5)).toBe(1.00067);
		});

	});

	describe("halfway values round toward +Infinity (Math.round semantics)", () => {

		test(`2.5 → 3`, () => {
			expect(round(2.5)).toBe(3);
		});

		test(`-0.5 → 0, not -1`, () => {
			expect(round(-0.5)).toBe(0);
		});

		test(`-2.5 → -2, not -3`, () => {
			expect(round(-2.5)).toBe(-2);
		});

	});

	describe("the string-exponent trick avoids float multiplication error", () => {

		test(`round(1.005, 2) → 1.01 (naive Math.round(v * 100) / 100 would give 1 because 1.005 is really 1.00499… in binary)`, () => {
			expect(round(1.005, 2)).toBe(1.01);
		});

		test(`values that round to zero come back as positive zero, never -0`, () => {
			expect(Object.is(round(-0.4), 0)).toBe(true);
		});

	});

	describe("non-finite inputs yield NaN", () => {

		test(`NaN value → NaN`, () => {
			expect(round(NaN)).toBeNaN();
		});

		test(`NaN decimals → NaN`, () => {
			expect(round(1, NaN)).toBeNaN();
		});

		test(`Infinity value → NaN (the isFiniteNumber guard; the string path produced "Infinitye0" → NaN anyway)`, () => {
			expect(round(Infinity)).toBeNaN();
			expect(round(-Infinity)).toBeNaN();
		});

		test(`Infinity decimals → NaN`, () => {
			expect(round(1, Infinity)).toBeNaN();
			expect(round(1, -Infinity)).toBeNaN();
		});

		test(`numeric strings are NOT coerced — strictness matches boundNumber/hypot (the old global isNaN let "5" through by accident)`, () => {
			expect(round("5" as unknown as number)).toBe(NaN);
		});

	});

	describe("quirks", () => {

		test(`negative decimals always yield NaN — the template builds "12e--2" which parses as NaN`, () => {
			expect(round(1234, -2)).toBeNaN();
			expect(round(-1234, -2)).toBeNaN();
		});

		test(`values that stringify in exponential form yield NaN — "1e+21" + "e2" is not a number`, () => {
			expect(round(1e21, 2)).toBeNaN();
		});

		test(`tiny values stringify exponentially too — round(1.5e-7, 2) → NaN (and even without the exponent it would only ever reach 0)`, () => {
			expect(round(1.5e-7, 2)).toBeNaN();
		});

	});

});
