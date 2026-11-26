import { describe, expect, test } from "vitest";
import { or, sortPrimitive } from "../../build/index.js";
import type { Sorter } from "../../build/index.js";

	describe("sorters", () => {
		test(`or((a,b)=>sortPrimitive(a.level,b.level),(a,b)=>sortPrimitive(a.name,b.name))`, () => {
			const input = [{level:0,name:"Zero"},{level:1,name:"Zero"},{level:0,name:"zero"},{level:0,name:"one"},{level:1,name:"zero"},{level:1,name:"one"}];
			const expected = [{level:0,name:"one"},{level:0,name:"Zero"},{level:0,name:"zero"},{level:1,name:"one"},{level:1,name:"Zero"},{level:1,name:"zero"}];
			expect(input).not.toStrictEqual(expected);

			type Entry = { level:number; name:string };
			const byLevel: Sorter<Entry> = (a, b) => sortPrimitive(a?.level, b?.level);
			const byName: Sorter<Entry> = (a, b) => sortPrimitive(a?.name, b?.name);

			// no cast needed: the Sorter overload is declared first, so typed sorters flow through as Sorter<Entry> (pending #10 fix)
			input.sort(or(byLevel, byName));
			expect(input).toStrictEqual(expected);

			// inline lambdas bind to the Sorter overload too — params are contextually Optional<Entry>, which is honest: comparators receive nullish operands
			input.sort(or((a: Entry | null | undefined, b: Entry | null | undefined) => sortPrimitive(a?.level, b?.level), (a: Entry | null | undefined, b: Entry | null | undefined) => sortPrimitive(a?.name, b?.name)));
			expect(input).toStrictEqual(expected);
		});

		test(`or(sorters) returns the FIRST non-zero result and the last falsy (0) when all are equal`, () => {
			type Named = { name:string };
			const byLength: Sorter<Named> = (a, b) => sortPrimitive(a?.name.length, b?.name.length);
			const combined = or(byLength, byLength);

			// equal lengths through both sorters -> the last falsy result (0) is returned
			expect(combined({ name:"ab" }, { name:"cd" })).toBe(0);
			// a real difference still resolves
			expect(combined({ name:"a" }, { name:"ab" })).toBe(-1);
		});

		test(`or(sorters) short-circuits: later sorters are not consulted once one returns -1/1`, () => {
			type V = { v:number };
			const first: Sorter<V> = (a, b) => a!.v < b!.v ? -1 : 1;
			const second: Sorter<V> = () => { throw new Error("must not be called"); };
			const combined = or(first, second);
			expect(combined({ v:1 }, { v:2 })).toBe(-1);
		});

		test(`or(sorters) on primitives returns the raw comparator result`, () => {
			const byNumber: Sorter<number> = (a, b) => sortPrimitive(a, b);
			const chained = or(byNumber, byNumber);
			expect(chained(1, 2)).toBe(-1);
		});

		test(`or() with no sorters returns a noop that treats every pair as equal (0)`, () => {
			const combined = or();
			expect(combined(1, 2)).toBe(0);
			const input = [2, 1];
			input.sort(combined);
			expect(input).toStrictEqual([2, 1]);
		});

		test(`overload precedence: a lambda returning -1/0/1 binds to the Sorter overload; anything else (boolean/string/truthy values) falls through to Filter`, () => {
			// () => 0 returns a literal in SortResult, so it is typed as a Sorter (2 params), not a Filter
			const asSorter = or(() => 0);
			expect(asSorter(1, 2)).toBe(0);
			// boolean/string returns cannot be SortResults — these stay Filters and keep the 3-arg call shape
			const asFilter = or(() => "yes");
			expect(asFilter(1, 0, [1])).toBe("yes");
			const asBoolFilter = or((v: number) => v > 0);
			expect([(-1), 2].filter(asBoolFilter)).toStrictEqual([2]);
		});
	});
