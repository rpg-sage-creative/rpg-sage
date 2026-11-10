import { describe, expect, test } from "vitest";
import { applyChanges, stringifyJson } from "../build/index.js";

describe("json", () => {
	describe("applyChanges", () => {

		// [input, changes, output, changed]
		const tests = [
			[{}, {}, {}, false],

			[{ zero:0 }, { zero:0n }, { zero:0n }, true],

			[{ a:"Apple" }, { a:"Apple" }, { a:"Apple" }, false],
			[{ a:"Apple" }, { a:"alpha" }, { a:"alpha" }, true],
			[{ a:"Apple" }, { a:null }, { a:undefined }, true],
			[{ a:"Apple" }, { a:undefined }, { a:"Apple" }, false],

			[{ a:"Apple", b:"Banana" }, { a:"alpha", b:undefined }, { a:"alpha", b:"Banana" }, true],
			[{ a:"Apple", b:"Banana" }, { a:"alpha", b:null }, { a:"alpha", b:undefined }, true],
			[{ a:"Apple", b:"Banana" }, { a:"alpha", b:"beta" }, { a:"alpha", b:"beta" }, true],
			[{ a:"Apple", b:"Banana" }, { a:undefined, b:undefined }, { a:"Apple", b:"Banana" }, false],
			[{ a:"Apple", b:"Banana" }, { a:null, b:null }, { a:undefined, b:undefined }, true],
			[{ a:"Apple", b:"Banana" }, { a:null, b:null }, { }, true],
		];

		tests.forEach(([input, changes, output, changed]) => {
			test(`applyChanges(${stringifyJson(input)}, ${stringifyJson(changes)}) equals ${stringifyJson(output)}`, () => {
				const applied = applyChanges(input, changes);
				expect(applied).toBe(changed);
				expect(input).toEqual(output);
			});
		});

		test("applyChanges unsets to unsetValue when one is given", () => {
			const input = { a:"Apple" as string | null };
			expect(applyChanges(input, { a:null }, null)).toBe(true);
			expect(input).toStrictEqual({ a:null });
		});

		test("applyChanges returns false when base or changes is falsy", () => {
			expect(applyChanges(null as never, { a:1 } as never)).toBe(false);
			expect(applyChanges(undefined as never, { a:1 } as never)).toBe(false);
			expect(applyChanges({ a:"Apple" } as never, null as never)).toBe(false);
		});

		test("applyChanges adds keys that are not on the base", () => {
			const input: Record<string, unknown> = { a:"Apple" };
			expect(applyChanges(input, { b:"Banana" })).toBe(true);
			expect(input).toStrictEqual({ a:"Apple", b:"Banana" });
		});

		test("applyChanges reports no change when the same value reference is set", () => {
			const value = { x:1 };
			const input: Record<string, unknown> = { a:value };
			expect(applyChanges(input, { a:value })).toBe(false);
		});

		// oldValue !== base[key] is true for NaN, so it always reports a change
		test("applyChanges reports a change when setting NaN over NaN", () => {
			const input: Record<string, unknown> = { a:NaN };
			expect(applyChanges(input, { a:NaN })).toBe(true);
		});
	});
});