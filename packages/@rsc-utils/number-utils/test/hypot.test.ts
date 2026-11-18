import { describe, expect, test } from "vitest";
import { hypot } from "../build/index.js";

describe("hypot", () => {

	describe("two dimensions", () => {

		test(`3, 4 → 5`, () => {
			expect(hypot(3, 4)).toBe(5);
		});

		test(`negatives are squared away — -3, -4 → 5`, () => {
			expect(hypot(-3, -4)).toBe(5);
		});

		test(`0, 0 → 0`, () => {
			expect(hypot(0, 0)).toBe(0);
		});

	});

	describe("three dimensions — hypot(hypot(x, y), z)", () => {

		test(`3, 4, 12 → 13`, () => {
			expect(hypot(3, 4, 12)).toBe(13);
		});

		test(`z of 0 matches the two-argument result`, () => {
			expect(hypot(3, 4, 0)).toBe(hypot(3, 4));
		});

		test(`omitted z behaves like no third leg`, () => {
			expect(hypot(5, 12)).toBe(13);
		});

	});

	describe("non-finite values", () => {

		test(`NaN in x or y yields 0`, () => {
			expect(hypot(NaN, 1)).toBe(0);
			expect(hypot(1, NaN)).toBe(0);
		});

		test(`Infinity in x or y yields 0 — a boundless leg is not hypotenuse-able`, () => {
			expect(hypot(Infinity, 1)).toBe(0);
			expect(hypot(1, -Infinity)).toBe(0);
		});

		test(`a non-finite z is ignored — the two-dimension result stands`, () => {
			expect(hypot(3, 4, NaN)).toBe(5);
			expect(hypot(3, 4, Infinity)).toBe(5);
		});

	});

});
