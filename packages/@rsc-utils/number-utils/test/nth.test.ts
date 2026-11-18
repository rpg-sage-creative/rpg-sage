import { describe, expect, test } from "vitest";
import { nth } from "../build/index.js";

describe("nth", () => {

	// Total function: never throws — input is normalized (rounded, signed, non-finite → 0).

	describe("single digits", () => {

		test(`0 → "0th"`, () => {
			expect(nth(0)).toBe("0th");
		});

		test(`1 → "1st"`, () => {
			expect(nth(1)).toBe("1st");
		});

		test(`2 → "2nd"`, () => {
			expect(nth(2)).toBe("2nd");
		});

		test(`3 → "3rd"`, () => {
			expect(nth(3)).toBe("3rd");
		});

		test(`4 → "4th"`, () => {
			expect(nth(4)).toBe("4th");
		});

		test(`5 → "5th"`, () => {
			expect(nth(5)).toBe("5th");
		});

	});

	describe("teens", () => {

		test(`10 → "10th"`, () => {
			expect(nth(10)).toBe("10th");
		});

		test(`11 is excluded from the -st rule → "11th"`, () => {
			expect(nth(11)).toBe("11th");
		});

		test(`12 is excluded from the -nd rule → "12th"`, () => {
			expect(nth(12)).toBe("12th");
		});

		test(`13 is excluded from the -rd rule → "13th"`, () => {
			expect(nth(13)).toBe("13th");
		});

	});

	describe("higher decades", () => {

		test(`21 → "21st"`, () => {
			expect(nth(21)).toBe("21st");
		});

		test(`32 → "32nd"`, () => {
			expect(nth(32)).toBe("32nd");
		});

		test(`43 → "43rd"`, () => {
			expect(nth(43)).toBe("43rd");
		});

	});

	describe("teens at any magnitude", () => {

		test(`111 → "111th" (the exact-value-only exclusion is fixed)`, () => {
			expect(nth(111)).toBe("111th");
		});

		test(`112 → "112th" and 113 → "113th"`, () => {
			expect(nth(112)).toBe("112th");
			expect(nth(113)).toBe("113th");
		});

		test(`1011 → "1011th" and 1112 → "1112th" — the rule looks at the last two digits, not the value`, () => {
			expect(nth(1011)).toBe("1011th");
			expect(nth(1112)).toBe("1112th");
		});

		test(`only exact teens are excluded — 121/122/123 still get st/nd/rd`, () => {
			expect(nth(121)).toBe("121st");
			expect(nth(122)).toBe("122nd");
			expect(nth(123)).toBe("123rd");
		});

	});

	describe("normalization (never throws)", () => {

		test(`non-whole values are rounded — 1.5 → "2nd", 2.4 → "2nd", 0.6 → "1st"`, () => {
			expect(nth(1.5)).toBe("2nd");
			expect(nth(2.4)).toBe("2nd");
			expect(nth(0.6)).toBe("1st");
		});

		test(`rounding can land in the teens — 10.6 → "11th"`, () => {
			expect(nth(10.6)).toBe("11th");
		});

		test(`halves round toward +Infinity (Math.round) and -0 stringifies as "0", never "-0th" — -0.5 → "0th"`, () => {
			expect(nth(-0.5)).toBe("0th");
		});

		test(`negatives keep their sign and take the suffix of their magnitude — -1/-2/-3 → st/nd/rd, -11 → th`, () => {
			expect(nth(-1)).toBe("-1st");
			expect(nth(-2)).toBe("-2nd");
			expect(nth(-3)).toBe("-3rd");
			expect(nth(-11)).toBe("-11th");
		});

		test(`non-finite values are treated as 0 — NaN and ±Infinity → "0th"`, () => {
			expect(nth(NaN)).toBe("0th");
			expect(nth(Infinity)).toBe("0th");
			expect(nth(-Infinity)).toBe("0th");
		});

	});

});
