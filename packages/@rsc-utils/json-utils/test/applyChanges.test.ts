import { describe, expect, test } from "vitest";
import { applyChanges } from "../build/index.js";

describe("applyChanges", () => {

	test("applyChanges makes no changes when both objects are empty", () => {
		const input = {};
		expect(applyChanges(input, {})).toBe(false);
		expect(input).toStrictEqual({});
	});

	test("applyChanges counts a bigint as a change over the number 0 (0 !== 0n)", () => {
		const input: { zero:number | bigint } = { zero:0 };
		expect(applyChanges(input, { zero:0n })).toBe(true);
		expect(input).toStrictEqual({ zero:0n });
	});

	test("applyChanges reports no change when setting the same string value", () => {
		const input = { a:"Apple" };
		expect(applyChanges(input, { a:"Apple" })).toBe(false);
		expect(input).toStrictEqual({ a:"Apple" });
	});

	test("applyChanges applies a different string value", () => {
		const input = { a:"Apple" };
		expect(applyChanges(input, { a:"alpha" })).toBe(true);
		expect(input).toStrictEqual({ a:"alpha" });
	});

	test("applyChanges unsets to undefined when the change is null", () => {
		const input: { a:string | null } = { a:"Apple" };
		expect(applyChanges(input, { a:null })).toBe(true);
		expect(input).toStrictEqual({ a:undefined });
	});

	test("applyChanges skips keys whose change value is undefined", () => {
		const input = { a:"Apple" };
		expect(applyChanges(input, { a:undefined })).toBe(false);
		expect(input).toStrictEqual({ a:"Apple" });
	});

	test("applyChanges applies one key and skips another that is undefined", () => {
		const input: { a:string | null; b:string | null } = { a:"Apple", b:"Banana" };
		expect(applyChanges(input, { a:"alpha", b:undefined })).toBe(true);
		expect(input).toStrictEqual({ a:"alpha", b:"Banana" });
	});

	test("applyChanges applies one key and unsets another that is null", () => {
		const input: { a:string | null; b:string | null } = { a:"Apple", b:"Banana" };
		expect(applyChanges(input, { a:"alpha", b:null })).toBe(true);
		expect(input).toStrictEqual({ a:"alpha", b:undefined });
	});

	test("applyChanges applies two different string values", () => {
		const input = { a:"Apple", b:"Banana" };
		expect(applyChanges(input, { a:"alpha", b:"beta" })).toBe(true);
		expect(input).toStrictEqual({ a:"alpha", b:"beta" });
	});

	test("applyChanges reports no change when every key is undefined", () => {
		const input: { a:string | null; b:string | null } = { a:"Apple", b:"Banana" };
		expect(applyChanges(input, { a:undefined, b:undefined })).toBe(false);
		expect(input).toStrictEqual({ a:"Apple", b:"Banana" });
	});

	test("applyChanges unsets every key that is null (keys remain with undefined values)", () => {
		const input: { a:string | null; b:string | null } = { a:"Apple", b:"Banana" };
		expect(applyChanges(input, { a:null, b:null })).toBe(true);
		expect(input).toStrictEqual({ a:undefined, b:undefined });
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

	// the key is added with value undefined, which compares equal to the missing old value
	test("applyChanges adds an undefined key for a null change but reports no change", () => {
		const input: Record<string, unknown> = {};
		expect(applyChanges(input, { a:null })).toBe(false);
		expect(Object.hasOwn(input, "a")).toBe(true);
		expect(input.a).toBeUndefined();
	});

	test("applyChanges reports no change when unsetting an already-undefined key to undefined", () => {
		const input: Record<string, unknown> = { a:undefined };
		expect(applyChanges(input, { a:null })).toBe(false);
		expect(Object.hasOwn(input, "a")).toBe(true);
	});

	test("applyChanges reports a change when unsetting a null key (null !== undefined)", () => {
		const input: Record<string, unknown> = { a:null };
		expect(applyChanges(input, { a:null })).toBe(true);
		expect(input.a).toBeUndefined();
	});

});
