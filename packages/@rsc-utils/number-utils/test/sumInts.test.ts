import { describe, expect, test } from "vitest";
import { sumInts } from "../build/index.js";

describe("sumInts", () => {

	test(`integers — [1, 2, -3, -4, 3] → -1`, () => {
		expect(sumInts([1, 2, -3, -4, 3])).toBe(-1);
	});

	test(`[1, 2, 3, 4] → 10`, () => {
		expect(sumInts([1, 2, 3, 4])).toBe(10);
	});

	test(`empty array → 0`, () => {
		expect(sumInts([])).toBe(0);
	});

	test(`a NaN element poisons the total`, () => {
		expect(sumInts([NaN, 1])).toBeNaN();
	});

	test(`quirk: despite the name it accepts floats — and accumulates them naively, so [0.1, 0.2] → 0.30000000000000004`, () => {
		expect(sumInts([0.1, 0.2])).toBe(0.30000000000000004);
	});

	test(`single value returns it unchanged`, () => {
		expect(sumInts([7])).toBe(7);
	});

});
