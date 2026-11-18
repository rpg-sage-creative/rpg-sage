import { describe, expect, test } from "vitest";
import { celsiusToFahrenheit } from "../../build/index.js";

describe("celsiusToFahrenheit", () => {

	describe("known conversions with explicit decimals", () => {

		test(`-1°C at 1 decimal → 30.2°F`, () => {
			expect(celsiusToFahrenheit(-1, 1)).toBe(30.2);
		});

		test(`0°C → 32°F`, () => {
			expect(celsiusToFahrenheit(0)).toBe(32);
		});

		test(`1°C at 1 decimal → 33.8°F`, () => {
			expect(celsiusToFahrenheit(1, 1)).toBe(33.8);
		});

		test(`99°C at 1 decimal → 210.2°F`, () => {
			expect(celsiusToFahrenheit(99, 1)).toBe(210.2);
		});

		test(`100°C → 212°F (boiling)`, () => {
			expect(celsiusToFahrenheit(100)).toBe(212);
		});

		test(`-40°C → -40°F (the crossover point)`, () => {
			expect(celsiusToFahrenheit(-40)).toBe(-40);
		});

		test(`37°C at 1 decimal → 98.6°F (body temperature)`, () => {
			expect(celsiusToFahrenheit(37, 1)).toBe(98.6);
		});

	});

	describe("decimals default to whole numbers", () => {

		test(`-1°C with no decimals rounds down to 30°F (not 30.2)`, () => {
			expect(celsiusToFahrenheit(-1)).toBe(30);
		});

		test(`-0.555556°C → 31°F — explicitly passing undefined still rounds (the default parameter intercepts it; the unrounded branch is unreachable)`, () => {
			// @ts-expect-error the overloads reject an explicit undefined, but at runtime the default parameter accepts it
			expect(celsiusToFahrenheit(-0.555556, undefined)).toBe(31);
		});

		test(`0.555556°C → 33°F (rounds up from 32.9999…)`, () => {
			expect(celsiusToFahrenheit(0.555556, 0)).toBe(33);
		});

		test(`36.6°C → 98°F at 0 decimals (from 97.88)`, () => {
			expect(celsiusToFahrenheit(36.6, 0)).toBe(98);
		});

	});

	describe("special values", () => {

		test(`NaN in → NaN out`, () => {
			expect(celsiusToFahrenheit(NaN)).toBeNaN();
		});

		test(`Infinity → NaN — the default rounding stringifies "Infinitye0", which is not a number`, () => {
			expect(celsiusToFahrenheit(Infinity)).toBeNaN();
		});

	});

});
