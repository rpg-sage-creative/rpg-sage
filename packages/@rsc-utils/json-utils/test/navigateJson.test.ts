import { describe, expect, test } from "vitest";
import { navigateJson } from "../build/index.js";

describe("navigateJson", () => {

	// full navigation

	test("navigateJson fully navigates a single key", () => {
		expect(navigateJson({ a:1 }, "a")).toEqual({ depth:1, path:"a", isFull:true, parent:{ a:1 }, key:"a", value:1 });
	});

	test("navigateJson fully navigates two keys", () => {
		expect(navigateJson({ a:{ b:1 } }, "a.b")).toEqual({ depth:2, path:"a.b", isFull:true, parent:{ b:1 }, key:"b", value:1 });
	});

	test("navigateJson navigates through array indices as keys", () => {
		expect(navigateJson({ list:[{ n:1 }] }, "list.0.n")).toEqual({ depth:3, path:"list.0.n", isFull:true, parent:{ n:1 }, key:"n", value:1 });
	});

	test("navigateJson navigates directly to an array index on a top-level array", () => {
		const results = navigateJson([1, 2], "1");
		expect(results).toMatchObject({ depth:1, path:"1", isFull:true, key:"1", value:2 });
	});

	test("navigateJson fully navigates to an object value", () => {
		expect(navigateJson({ a:{ b:{ c:2 } } }, "a.b")).toEqual({ depth:2, path:"a.b", isFull:true, parent:{ b:{ c:2 } }, key:"b", value:{ c:2 } });
	});

	test("navigateJson reports a full navigation when the existing value is undefined", () => {
		expect(navigateJson({ a:undefined }, "a")).toEqual({ depth:1, path:"a", isFull:true, parent:{ a:undefined }, key:"a", value:undefined });
	});

	// missing keys stop at the last object navigated

	test("navigateJson stops immediately when the first key is missing", () => {
		expect(navigateJson({ a:1 }, "x")).toEqual({ depth:0, path:"", isFull:false, parent:{ a:1 }, key:"x" });
	});

	test("navigateJson stops at the last object navigated when an inner key is missing", () => {
		expect(navigateJson({ a:{ b:1 } }, "a.x.y")).toEqual({ depth:1, path:"a", isFull:false, parent:{ b:1 }, key:"x" });
	});

	// navigation stops when the next value is not an object (hasOwn on a primitive fails)
	test("navigateJson stops when it must descend into a non-object value", () => {
		expect(navigateJson({ a:{ b:1 } }, "a.b.c")).toEqual({ depth:2, path:"a.b", isFull:false, parent:1, key:"c" });
	});

	test("navigateJson cannot navigate null", () => {
		expect(navigateJson(null, "a")).toEqual({ depth:0, path:"", isFull:false, parent:null, key:"a" });
	});

	test("navigateJson cannot navigate undefined", () => {
		expect(navigateJson(undefined, "a")).toEqual({ depth:0, path:"", isFull:false, parent:undefined, key:"a" });
	});

	// the empty path equals the joined navigated path of zero keys, so isFull comes out true
	test("navigateJson reports an empty path as fully navigated (isFull quirk)", () => {
		expect(navigateJson({ a:1 }, "")).toEqual({ depth:0, path:"", isFull:true, parent:{ a:1 }, key:"" });
	});

	test("navigateJson reports an empty path on null as fully navigated too", () => {
		expect(navigateJson(null, "")).toEqual({ depth:0, path:"", isFull:true, parent:null, key:"" });
	});

	// empty segments (from a trailing or doubled dot) are falsy keys and stop navigation
	test("navigateJson stops at the last object navigated on a trailing dot", () => {
		expect(navigateJson({ a:{ b:1 } }, "a.")).toEqual({ depth:1, path:"a", isFull:false, parent:{ b:1 }, key:"" });
	});

	test("navigateJson stops at the last object navigated on a doubled dot", () => {
		expect(navigateJson({ a:{ b:1 } }, "a..b")).toEqual({ depth:1, path:"a", isFull:false, parent:{ b:1 }, key:"" });
	});

});
