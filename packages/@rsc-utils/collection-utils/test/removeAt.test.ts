import { describe, expect, test } from "vitest";
import { removeAt } from "../build/index.js";

describe("removeAt", () => {
	// describe("removeAt", () => {

		test(`removeAt`, () => {
			const input = [2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];

			// remove and return value at index 1
			const expectedRemoved1 = 1;
			const expectedRemaining1 = [ 2, null, '2', true, null, undefined, 2, null, '1', 1, false, true];
			const removed1 = removeAt(input, 1);
			expect(removed1).toBe(expectedRemoved1);
			expect(input).toStrictEqual(expectedRemaining1);

			// remove and return value at index 1
			const expectedRemoved2 = [ null, '2' ];
			const expectedRemaining2 = [ 2, true, null, undefined, 2, null, '1', 1, false, true];
			const removed2 = removeAt(input, [1,2]);
			expect(removed2).toStrictEqual(expectedRemoved2);
			expect(input).toStrictEqual(expectedRemaining2);
		});

		test(`removeAt with an unsorted index list returns values in GIVEN order and splices safely from the highest index down`, () => {
			const input = [1, 2, 3, 4];
			const removed = removeAt(input, [3, 0]);
			expect(removed).toStrictEqual([4, 1]);
			expect(input).toStrictEqual([2, 3]);
		});

		test(`removeAt with an empty index list returns [] and changes nothing`, () => {
			const input = [1, 2];
			expect(removeAt(input, [])).toStrictEqual([]);
			expect(input).toStrictEqual([1, 2]);
		});

		test(`QUIRK: removeAt(array, -1) splices from the END — it removes and returns the LAST value`, () => {
			const input = [1, 2, 3, 4];
			expect(removeAt(input, -1)).toBe(4);
			expect(input).toStrictEqual([1, 2, 3]);
		});

		test(`removeAt with an out-of-range index returns undefined and changes nothing`, () => {
			const input = [1, 2];
			expect(removeAt(input, 10)).toBeUndefined();
			expect(input).toStrictEqual([1, 2]);
		});

		test(`duplicate indexes are deduped — the position is spliced once and reported once`, () => {
			const input = [1, 2, 3, 4];
			expect(removeAt(input, [1, 1])).toStrictEqual([2]);
			expect(input).toStrictEqual([1, 3, 4]);
		});

		test(`removeAt sorts indexes NUMERICALLY — [2, 10] on a 12-element array removes exactly those values (default .sort() is lexicographic and removed the wrong element)`, () => {
			const input = Array.from({ length: 12 }, (_, i) => i);
			expect(removeAt(input, [2, 10])).toStrictEqual([2, 10]);
			expect(input).toStrictEqual([0, 1, 3, 4, 5, 6, 7, 8, 9, 11]);
		});

		test(`negative indexes in a list count from the END and are reported with their actual values in GIVEN order`, () => {
			const input = ["a", "b", "c", "d"];
			expect(removeAt(input, [-1, -2])).toStrictEqual(["d", "c"]);
			expect(input).toStrictEqual(["a", "b"]);
		});

		test(`mixed positive and negative indexes splice safely together`, () => {
			const input = ["a", "b", "c", "d"];
			expect(removeAt(input, [0, -1])).toStrictEqual(["a", "d"]);
			expect(input).toStrictEqual(["b", "c"]);
		});

		test(`negative and positive aliases of the same position dedupe — [-1, 2] removes ONE value`, () => {
			const input = ["a", "b", "c"];
			expect(removeAt(input, [-1, 2])).toStrictEqual(["c"]);
			expect(input).toStrictEqual(["a", "b"]);
		});

		test(`non-integer and out-of-range indexes are skipped — the return contains only actually-removed values (no phantom undefined)`, () => {
			const input = ["a", "b", "c"];
			expect(removeAt(input, [NaN, 1.5, -5, 99])).toStrictEqual([]);
			expect(input).toStrictEqual(["a", "b", "c"]);

			// valid indexes alongside invalid ones report only the real removals
			const mixed = ["a", "b", "c"];
			expect(removeAt(mixed, [0, NaN, 99])).toStrictEqual(["a"]);
			expect(mixed).toStrictEqual(["b", "c"]);
		});

	// });
});
