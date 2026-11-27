import { isDefined } from "@rsc-utils/type-utils";
import { describe, expect, test } from "vitest";
import { remove } from "../build/index.js";

describe("remove", () => {
	// describe("remove", () => {

		test(`remove`, () => {
			const input = [2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];
			const expectedRemoved = [2,1,"2",true,2,"1",1,false,true];
			const expectedRemaining = [ null, null, undefined, null ];
			const removed = remove(input, isDefined);
			expect(removed).toStrictEqual(expectedRemoved);
			expect(input).toStrictEqual(expectedRemaining);
		});

		test(`remove mutates the input array in place and returns the removed values`, () => {
			const input = ["a", "b", "c"];
			const removed = remove(input, v => v === "b");
			expect(removed).toStrictEqual(["b"]);
			expect(input).toStrictEqual(["a", "c"]);
		});

		test(`remove with no matches returns [] and leaves the input untouched`, () => {
			const input = [1, null, 2];
			expect(remove(input, () => false)).toStrictEqual([]);
			expect(input).toStrictEqual([1, null, 2]);
		});

		test(`removed null/undefined values are RETURNED, not filtered (the old isDefined filter dropped them from the report)`, () => {
			const input = [null, "x"];
			const removed = remove(input, () => true);
			expect(removed).toStrictEqual([null, "x"]);
			expect(input).toStrictEqual([]);
		});

		test(`remove passes thisArg to the predicate`, () => {
			const input = ["a", null, "b"];
			function predicate(this: { match:string }, value:string | null) {
				return value === this.match;
			}
			expect(remove(input, predicate, { match:"a" })).toStrictEqual(["a"]);
			expect(input).toStrictEqual([null, "b"]);
		});

		test(`remove on a >10-element array splices correctly across the digit boundary (indexes are sorted numerically)`, () => {
			const input = Array.from({ length: 12 }, (_, i) => i);
			const removed = remove(input, value => value % 2 === 0);
			expect(removed).toStrictEqual([0, 2, 4, 6, 8, 10]);
			expect(input).toStrictEqual([1, 3, 5, 7, 9, 11]);
		});

	// });
});
