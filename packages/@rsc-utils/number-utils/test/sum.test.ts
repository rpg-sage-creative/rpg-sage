import { describe, expect, test } from "vitest";
import { sum } from "../build/index.js";

describe("sum", () => {

	// @deprecated without a mapper — kept covered for existing consumers; see sumInts/sumPrecise.

	describe("without a mapper (deprecated overload)", () => {

		test(`[1, 2, -3, -4, 3] → -1`, () => {
			expect(sum([1, 2, -3, -4, 3])).toBe(-1);
		});

		test(`[1, 2, 3, 4] → 10`, () => {
			expect(sum([1, 2, 3, 4])).toBe(10);
		});

		test(`explicitly passing undefined as the mapper falls through to the no-mapper path`, () => {
			// @ts-expect-error the overloads reject an explicit undefined, but at runtime the default parameter accepts it
			expect(sum([1, 2, 3, 4], undefined)).toBe(10);
		});

		test(`empty array → 0`, () => {
			expect(sum([])).toBe(0);
		});

		test(`a NaN element poisons the total`, () => {
			expect(sum([NaN, 1])).toBeNaN();
		});

	});

	describe("with a mapper", () => {

		test(`numbers doubled — [1, 2, 3, 4] with n => n * 2 → 20`, () => {
			expect(sum([1, 2, 3, 4], (n) => n * 2)).toBe(20);
		});

		test(`objects — mapper receives (value, index, values) and its results are summed`, () => {
			const values = [1, 2, 3, 4].map((val) => ({ val }));
			expect(sum(values, (o) => o.val)).toBe(10);
		});

		test(`mapper runs with the correct index and array arguments`, () => {
			const seen: Array<[string, number, string[]]> = [];
			sum(["a", "b"], (value, index, values) => {
				seen.push([value, index, values]);
				return 1;
			});
			expect(seen).toEqual([["a", 0, ["a", "b"]], ["b", 1, ["a", "b"]]]);
		});

		test(`empty array with a mapper → 0 (mapper never runs)`, () => {
			expect(sum([], () => 5)).toBe(0);
		});

	});

});
