import { describe, expect, test } from "vitest";
import { cleanJson } from "../build/index.js";

describe("cleanJson", () => {

	// deleteBlankString

	test("cleanJson keeps an empty string without deleteBlankString", () => {
		expect(cleanJson({ a:"Apple", b:"" }, {})).toStrictEqual({ a:"Apple", b:"" });
	});

	test("cleanJson deletes an empty string with deleteBlankString", () => {
		expect(cleanJson({ a:"Apple", b:"" }, { deleteBlankString:true })).toStrictEqual({ a:"Apple" });
	});

	test("cleanJson deletes a space-only string with deleteBlankString", () => {
		expect(cleanJson({ a:"Apple", b:" " }, { deleteBlankString:true })).toStrictEqual({ a:"Apple" });
	});

	test("cleanJson deletes a tab-only string with deleteBlankString", () => {
		expect(cleanJson({ a:"Apple", b:"\t" }, { deleteBlankString:true })).toStrictEqual({ a:"Apple" });
	});

	test("cleanJson deletes a newline-only string with deleteBlankString", () => {
		expect(cleanJson({ a:"Apple", b:"\n" }, { deleteBlankString:true })).toStrictEqual({ a:"Apple" });
	});

	// deleteEmptyArray

	test("cleanJson keeps an empty array without deleteEmptyArray", () => {
		expect(cleanJson({ a:["Apple"], b:[] }, {})).toStrictEqual({ a:["Apple"], b:[] });
	});

	test("cleanJson deletes an empty array with deleteEmptyArray", () => {
		expect(cleanJson({ a:["Apple"], b:[] }, { deleteEmptyArray:true })).toStrictEqual({ a:["Apple"] });
	});

	// deleteEmptyObject

	test("cleanJson keeps an empty object without deleteEmptyObject", () => {
		expect(cleanJson({ a:{ a:"Apple" }, b:{} }, {})).toStrictEqual({ a:{ a:"Apple" }, b:{} });
	});

	test("cleanJson deletes an already-empty object with deleteEmptyObject (no recursion needed)", () => {
		expect(cleanJson({ a:{ a:"Apple" }, b:{} }, { deleteEmptyObject:true })).toStrictEqual({ a:{ a:"Apple" } });
	});

	// deleteEmptyString

	test("cleanJson keeps an empty string without deleteEmptyString", () => {
		expect(cleanJson({ a:"Apple", b:"" }, {})).toStrictEqual({ a:"Apple", b:"" });
	});

	test("cleanJson deletes an empty string with deleteEmptyString", () => {
		expect(cleanJson({ a:"Apple", b:"" }, { deleteEmptyString:true })).toStrictEqual({ a:"Apple" });
	});

	test("cleanJson keeps whitespace-only strings with deleteEmptyString (only \"\" matches)", () => {
		expect(cleanJson({ a:"Apple", b:" " }, { deleteEmptyString:true })).toStrictEqual({ a:"Apple", b:" " });
		expect(cleanJson({ a:"Apple", b:"\t" }, { deleteEmptyString:true })).toStrictEqual({ a:"Apple", b:"\t" });
		expect(cleanJson({ a:"Apple", b:"\n" }, { deleteEmptyString:true })).toStrictEqual({ a:"Apple", b:"\n" });
	});

	// deleteFalse

	test("cleanJson keeps false without deleteFalse", () => {
		expect(cleanJson({ a:"Apple", b:false }, {})).toStrictEqual({ a:"Apple", b:false });
	});

	test("cleanJson deletes false with deleteFalse", () => {
		expect(cleanJson({ a:"Apple", b:false }, { deleteFalse:true })).toStrictEqual({ a:"Apple" });
	});

	// deleteNaN

	test("cleanJson keeps NaN without deleteNaN", () => {
		expect(cleanJson({ a:"Apple", b:NaN }, {})).toStrictEqual({ a:"Apple", b:NaN });
	});

	test("cleanJson deletes NaN with deleteNaN", () => {
		expect(cleanJson({ a:"Apple", b:NaN }, { deleteNaN:true })).toStrictEqual({ a:"Apple" });
	});

	// deleteNull

	test("cleanJson keeps null without deleteNull", () => {
		expect(cleanJson({ a:"Apple", b:null }, {})).toStrictEqual({ a:"Apple", b:null });
	});

	test("cleanJson deletes null with deleteNull", () => {
		expect(cleanJson({ a:"Apple", b:null }, { deleteNull:true })).toStrictEqual({ a:"Apple" });
	});

	// deleteUndefined

	test("cleanJson deletes undefined by default (minimum rules)", () => {
		const input = { a:"Apple", b:undefined as string | undefined };
		expect(cleanJson(input)).toStrictEqual({ a:"Apple" });
	});

	test("cleanJson keeps undefined with explicit empty rules", () => {
		expect(cleanJson({ a:"Apple", b:undefined }, {})).toStrictEqual({ a:"Apple", b:undefined });
	});

	test("cleanJson deletes undefined with deleteUndefined", () => {
		expect(cleanJson({ a:"Apple", b:undefined }, { deleteUndefined:true })).toStrictEqual({ a:"Apple" });
	});

	// deleteZero

	test("cleanJson keeps 0 without deleteZero", () => {
		expect(cleanJson({ a:"Apple", b:0 }, {})).toStrictEqual({ a:"Apple", b:0 });
	});

	test("cleanJson keeps 0n without deleteZero", () => {
		expect(cleanJson({ a:"Apple", b:0n }, {})).toStrictEqual({ a:"Apple", b:0n });
	});

	test("cleanJson deletes 0 with deleteZero", () => {
		expect(cleanJson({ a:"Apple", b:0 }, { deleteZero:true })).toStrictEqual({ a:"Apple" });
	});

	// -0 === 0 is true, so the same rule catches both signed zeros
	test("cleanJson deletes +0 and -0 with deleteZero (=== comparison)", () => {
		expect(cleanJson({ a:"Apple", b:+0 }, { deleteZero:true })).toStrictEqual({ a:"Apple" });
		expect(cleanJson({ a:"Apple", b:-0 }, { deleteZero:true })).toStrictEqual({ a:"Apple" });
	});

	test("cleanJson deletes 0n with deleteZero (=== comparison)", () => {
		expect(cleanJson({ a:"Apple", b:0n }, { deleteZero:true })).toStrictEqual({ a:"Apple" });
	});

	// recursive

	test("cleanJson keeps nested undefined without recursion", () => {
		expect(cleanJson({ a:"Apple", b:{ c:undefined } }, {})).toStrictEqual({ a:"Apple", b:{ c:undefined } });
	});

	test("cleanJson cleans nested objects with recursive (leaving the emptied object in place)", () => {
		expect(cleanJson({ a:"Apple", b:{ c:undefined } }, { deleteUndefined:true, recursive:true })).toStrictEqual({ a:"Apple", b:{} });
	});

	test("cleanJson deletes the nested object once recursion empties it with deleteEmptyObject", () => {
		expect(cleanJson({ a:"Apple", b:{ c:undefined } }, { deleteEmptyObject:true, deleteUndefined:true, recursive:true })).toStrictEqual({ a:"Apple" });
	});

	// recursive cleans objects inside arrays but never removes array elements
	test("cleanJson recursive cleans object keys inside arrays without removing elements", () => {
		expect(cleanJson([{ a:undefined }, { b:1 }], { deleteUndefined:true, recursive:true })).toStrictEqual([{ }, { b:1 }]);
	});

	test("cleanJson recursive empties an object element but never removes it from the array", () => {
		const input = [{ b:undefined }];
		cleanJson(input, { deleteUndefined:true, recursive:true });
		expect(Object.hasOwn(input[0], "b")).toBe(false);
		expect(input).toHaveLength(1);
	});

	// without recursion an object is neither cleaned nor deleted for being "empty"
	test("cleanJson without recursion neither cleans nor deletes a non-empty nested object", () => {
		expect(cleanJson({ b:{ c:undefined } }, { deleteEmptyObject:true })).toStrictEqual({ b:{ c:undefined } });
	});

	// dates are kept as-is
	test("cleanJson keeps Date values untouched (dates count as primitives)", () => {
		const date = new Date("2020-01-01T00:00:00.000Z");
		expect(cleanJson({ a:date, b:undefined })).toStrictEqual({ a:date });
	});

	test("cleanJson returns the same Date instance for a top-level date (primitive passthrough)", () => {
		const date = new Date(0);
		expect(cleanJson(date)).toBe(date);
	});

	// primitives are never cleaned, they are returned as-is
	test("cleanJson passes primitives through unchanged", () => {
		const u: undefined = undefined;
		expect(cleanJson(u)).toBeUndefined();
		expect(cleanJson(null)).toBeNull();
		expect(cleanJson(0)).toBe(0);
		expect(cleanJson("")).toBe("");
	});

	// top-level arrays are only touched with recursion/scrub
	test("cleanJson leaves a top-level array untouched without recursion", () => {
		const input = [{ a:undefined }];
		cleanJson(input, { deleteUndefined:true });
		expect(Object.hasOwn(input[0], "a")).toBe(true);
	});

	test("cleanJson cleans element keys of a top-level array with recursion but keeps length", () => {
		const input: [{ b?:undefined }, number] = [{ b:undefined }, 1];
		cleanJson(input, { deleteUndefined:true, recursive:true });
		expect(Object.hasOwn(input[0], "b")).toBe(false);
		expect(input).toHaveLength(2);
	});

	test("cleanJson deletes an empty nested array without recursion but never cleans its siblings' contents", () => {
		const input = { a:[{ b:undefined }], c:[] };
		cleanJson(input, { deleteEmptyArray:true });
		expect(Object.hasOwn(input.a[0], "b")).toBe(true);
		expect(Object.hasOwn(input, "c")).toBe(false);
	});

	// the object branch is gated on String(value) === "[object Object]"
	test("cleanJson skips objects with a custom toString (the \"[object Object]\" gate)", () => {
		const instance = { d:undefined as number | undefined, toString() { return "custom"; } };
		cleanJson({ c:instance }, { deleteUndefined:true });
		expect(Object.hasOwn(instance, "d")).toBe(true);
	});

	test("cleanJson throws a TypeError on a null-prototype object (String() cannot convert it)", () => {
		expect(() => cleanJson({ x:Object.create(null) }, { deleteUndefined:true })).toThrow(TypeError);
	});

	// scrub = maximum rules applied recursively

	test("cleanJson \"scrub\" deletes all falsey values and empty containers", () => {
		expect(cleanJson({ a:1, b:null, c:false, d:"", e:{ f:undefined }, g:[], h:0 }, "scrub")).toStrictEqual({ a:1 });
	});

	test("cleanJson \"scrub\" deletes null", () => {
		expect(cleanJson({ a:"Apple", b:null }, "scrub")).toStrictEqual({ a:"Apple" });
	});

	test("cleanJson \"scrub\" cleans nested objects recursively", () => {
		expect(cleanJson({ a:{ b:false, c:"x" } }, "scrub")).toStrictEqual({ a:{ c:"x" } });
	});

	// array elements are never deleted, even with "scrub"
	test("cleanJson \"scrub\" never removes array elements", () => {
		expect(cleanJson([1, null, "", {}], "scrub")).toStrictEqual([1, null, "", {}]);
	});

	test("cleanJson \"scrub\" cleans keys inside array element objects but keeps empty object elements", () => {
		const input = [{ x:null }, {}];
		cleanJson(input, "scrub");
		expect(Object.hasOwn(input[0], "x")).toBe(false);
		expect(input).toHaveLength(2);
	});

	test("cleanJson \"scrub\" on a top-level primitive returns it as-is", () => {
		expect(cleanJson(5, "scrub")).toBe(5);
	});

});
