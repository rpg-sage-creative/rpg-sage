import { isDefined, isNullOrUndefined } from "@rsc-utils/type-utils";
import { describe, expect, test, vi } from "vitest";
import { and, or, toUnique, toUniqueDefined } from "../build/index.js";
import type { Filter } from "../build/index.js";

describe("array", () => {
	describe("filters", () => {

		const input = [2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];

		test(`toUnique`, () => {
			const expected = [2,1,null,"2",true,undefined,"1",false];
			expect(input.filter(toUnique)).toStrictEqual(expected);
		});

		test(`toUniqueDefined`, () => {
			const expected = [2,1,"2",true,"1",false];
			expect(input.filter(toUniqueDefined)).toStrictEqual(expected);
		});

		test(`and(toUnique,isDefined)`, () => {
			const expected = [2,1,"2",true,"1",false];
			expect(input.filter(and(toUnique,isDefined))).toStrictEqual(expected);
		});

		test(`or(toUnique,isDefined)`, () => {
			const expected = [2,1,null,"2",true,undefined,2,"1",1,false,true];
			expect(input.filter(or(toUnique,isDefined))).toStrictEqual(expected);
		});

		test(`or(toUnique,isNullOrUndefined)`, () => {
			const expected = [2,1,null,"2",true,null,undefined,null,"1",false];
			expect(input.filter(or(toUnique,isNullOrUndefined))).toStrictEqual(expected);
		});

	});

	describe("quirks and edges", () => {

		test(`QUIRK: toUnique drops EVERY NaN — indexOf uses === and NaN never matches itself`, () => {
			const output = [Number.NaN, 1, Number.NaN].filter(toUnique);
			expect(output).toStrictEqual([1]);
		});

		test(`QUIRK: toUniqueDefined also drops NaN (defined, but the indexOf check fails)`, () => {
			const output = [Number.NaN, 1].filter(toUniqueDefined);
			expect(output).toStrictEqual([1]);
		});

		test(`toUnique keeps object references by identity`, () => {
			const shared = { a:1 };
			const output = [shared, shared, { b:2 }].filter(toUnique);
			expect(output.length).toBe(2);
			expect(output[0]).toBe(shared);
		});

		test(`and() with no filters keeps everything (vacuous truth noop)`, () => {
			expect(and()(1, 0, [1])).toBe(true);
			expect([1, 2].filter(and())).toStrictEqual([1, 2]);
		});

		test(`or() with no filters returns a falsey noop (0) that removes everything`, () => {
			expect((or() as Filter<unknown>)(1, 0, [1])).toBe(0);
			expect([1, 2].filter(or())).toStrictEqual([]);
		});

		test(`and(f)/or(f) with a solo filter returns that filter as-is`, () => {
			const f = (v: number) => v > 0;
			expect(and(f)).toBe(f);
			expect(or(f)).toBe(f);
		});

		test(`and short-circuits on the first failing filter`, () => {
			const second = vi.fn(() => true);
			const combined = and(() => false, second);
			expect(combined(1, 0, [1])).toBe(false);
			expect(second).toHaveBeenCalledTimes(0);
		});

		test(`and returns the RAW falsey value (not a boolean) or the last truthy result`, () => {
			const combined = and(() => "yes", () => 5);
			expect(combined(1, 0, [1])).toBe(5);
			expect(and(() => "", () => 5)(1, 0, [1])).toBe("");
		});

		test(`or short-circuits on the first truthy filter`, () => {
			const second = vi.fn(() => true);
			const combined = or(() => "yes", second);
			expect(combined(1, 0, [1])).toBe("yes");
			expect(second).toHaveBeenCalledTimes(0);
		});

		test(`or returns the RAW truthy value (not a boolean) or the last falsy result`, () => {
			expect(or(() => "yes")(1, 0, [1])).toBe("yes");
			// NOTE: use "" for the falsy probe — a lambda returning literal 0/-1/1 now binds to the Sorter overload (Sorter-first), not Filter; see sorters.test.ts precedence test
			expect(or(() => "")(1, 0, [1])).toBe("");
		});

	});
});
