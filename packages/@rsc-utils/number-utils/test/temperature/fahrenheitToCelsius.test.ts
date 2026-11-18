import { describe, expect, test } from "vitest";
import { fahrenheitToCelsius } from "../../build/index.js";

describe("fahrenheitToCelsius", () => {

	describe("known conversions with explicit decimals", () => {

		test(`30.2°F at 0 decimals → -1°C`, () => {
			expect(fahrenheitToCelsius(30.2, 0)).toBe(-1);
		});

		test(`31°F at 6 decimals → -0.555556°C`, () => {
			expect(fahrenheitToCelsius(31, 6)).toBe(-0.555556);
		});

		test(`32°F → 0°C (freezing)`, () => {
			expect(fahrenheitToCelsius(32)).toBe(0);
		});

		test(`33°F at 6 decimals → 0.555556°C`, () => {
			expect(fahrenheitToCelsius(33, 6)).toBe(0.555556);
		});

		test(`210.2°F at 0 decimals → 99°C`, () => {
			expect(fahrenheitToCelsius(210.2, 0)).toBe(99);
		});

		test(`212°F → 100°C (boiling)`, () => {
			expect(fahrenheitToCelsius(212)).toBe(100);
		});

		test(`-40°F → -40°C (the crossover point)`, () => {
			expect(fahrenheitToCelsius(-40)).toBe(-40);
		});

		test(`98.6°F at 1 decimal → 37°C (body temperature)`, () => {
			expect(fahrenheitToCelsius(98.6, 1)).toBe(37);
		});

	});

	describe("decimals default to whole numbers", () => {

		test(`31°F with no decimals rounds down to -1°C (from -0.555…)`, () => {
			expect(fahrenheitToCelsius(31)).toBe(-1);
		});

		test(`0°F → -18°C at default decimals (from -17.77…)`, () => {
			expect(fahrenheitToCelsius(0)).toBe(-18);
		});

		test(`explicitly passing undefined still rounds — the default parameter intercepts it, so the unrounded branch is unreachable`, () => {
			// @ts-expect-error the overloads reject an explicit undefined, but at runtime the default parameter accepts it
			expect(fahrenheitToCelsius(31, undefined)).toBe(-1);
		});

	});

	describe("special values", () => {

		test(`NaN in → NaN out`, () => {
			expect(fahrenheitToCelsius(NaN)).toBeNaN();
		});

		test(`-Infinity → NaN — the default rounding stringifies "-Infinitye0", which is not a number`, () => {
			expect(fahrenheitToCelsius(-Infinity)).toBeNaN();
		});

	});

});
