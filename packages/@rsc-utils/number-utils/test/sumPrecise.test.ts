import { describe, expect, test } from "vitest";
import { sumPrecise } from "../build/index.js";

describe("sumPrecise", () => {

	// Quirk: this is `Math.sumPrecise` when the runtime provides it and a plain
	// loop (sumInts) otherwise. Node 24 has no Math.sumPrecise, so on this repo's
	// runtime it behaves exactly like sumInts — assertions below stay true either way.

	test(`integers — [1, 2, 3] → 6`, () => {
		expect(sumPrecise([1, 2, 3])).toBe(6);
	});

	test(`empty array → 0`, () => {
		expect(sumPrecise([])).toBe(0);
	});

	test(`a NaN element poisons the total on both implementations`, () => {
		expect(sumPrecise([NaN, 1])).toBeNaN();
	});

	test(`[0.1, 0.2] lands within float epsilon of 0.3 — exact only where Math.sumPrecise exists`, () => {
		expect(Math.abs(sumPrecise([0.1, 0.2]) - 0.3)).toBeLessThan(Number.EPSILON);
	});

	test(`negative values are handled`, () => {
		expect(sumPrecise([-5, 5])).toBe(0);
	});

	test(`single value returns it unchanged`, () => {
		expect(sumPrecise([7])).toBe(7);
	});

});
