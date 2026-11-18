import { describe, expect, test } from "vitest";
import { areEqual } from "../build/index.js";

describe("areEqual", () => {

	test("areEqual({}) equals {}", () => {
		expect(areEqual({}, {})).toBe(true);
	});

	// stringifying removes keys with a value of undefined, so an undefined key matches a missing one
	test("areEqual({ empty:undefined }) equals {}", () => {
		expect(areEqual<Record<string, unknown>>({ empty:undefined }, {})).toBe(true);
	});

	test("areEqual({ empty:null }) does not equal {}", () => {
		expect(areEqual<Record<string, unknown>>({ empty:null }, {})).toBe(false);
	});

	test("areEqual({ one:\"one\" }) does not equal {}", () => {
		expect(areEqual<Record<string, unknown>>({ one:"one" }, {})).toBe(false);
	});

	test("areEqual({}) does not equal { one:\"one\" }", () => {
		expect(areEqual<Record<string, unknown>>({}, { one:"one" })).toBe(false);
	});

	test("areEqual({ one:\"one\" }) equals { one:\"one\" }", () => {
		expect(areEqual({ one:"one" }, { one:"one" })).toBe(true);
	});

	test("areEqual ignores key order without the strict option", () => {
		expect(areEqual({ one:"one", two:2 }, { two:2, one:"one" })).toBe(true);
	});

	test("areEqual requires key order with the strict option (both orders)", () => {
		expect(areEqual({ one:"one", two:2 }, { two:2, one:"one" }, { strict:true })).toBe(false);
		expect(areEqual({ two:2, one:"one" }, { one:"one", two:2 }, { strict:true })).toBe(false);
	});

	test("areEqual does not equal when a value differs by type (\"2\" vs 2)", () => {
		expect(areEqual<Record<string, unknown>>({ one:"one", two:"2" }, { two:2, one:"one" })).toBe(false);
	});

	test("areEqual ignores a differing key listed in ignore", () => {
		expect(areEqual<Record<string, unknown>>({ one:"one", two:"2" }, { two:2, one:"one" }, { ignore:["two"] })).toBe(true);
	});

	test("areEqual equals when keys are reordered across three properties", () => {
		expect(areEqual({ three:"3", one:1, two:2 }, { two:2, one:1, three:"3" })).toBe(true);
	});

	test("areEqual ignores a differing key even when its values differ by type", () => {
		expect(areEqual<Record<string, unknown>>({ three:"3", one:1, two:2 }, { two:2, one:1, three:3 }, { ignore:["three"] })).toBe(true);
	});

	// ignoring the whole key skips its nested differences entirely
	test("areEqual ignores a differing nested object when its key is ignored", () => {
		expect(areEqual<Record<string, unknown>>({ three:{"3":3, "3_4":3.4}, one:1, two:2 }, { two:2, one:1, three:{"3":3, "3_4":"3.4"} }, { ignore:["three"] })).toBe(true);
	});

	test("areEqual ignores a nested keyPath and still compares its siblings", () => {
		expect(areEqual<Record<string, unknown>>({ three:{"3":3, "3_4":3.4}, one:1, two:2 }, { two:2, one:1, three:{"3":3, "3_4":"3.4"} }, { ignore:["three.3_4"] })).toBe(true);
	});

	test("areEqual fails on a nested difference outside the ignored keyPath", () => {
		expect(areEqual<Record<string, unknown>>({ three:{"3":3, "3_4":3.4}, one:1, two:2 }, { two:2, one:1, three:{"3":"3", "3_4":"3.4"} }, { ignore:["three.3_4"] })).toBe(false);
	});

	test("areEqual equals equal primitives", () => {
		expect(areEqual(1, 1)).toBe(true);
	});

	test("areEqual does not equal differently-cased strings", () => {
		expect(areEqual("Apple", "apple")).toBe(false);
	});

	test("areEqual does not equal null vs undefined", () => {
		expect(areEqual<unknown>(null, undefined)).toBe(false);
	});

	test("areEqual equals two undefined values", () => {
		expect(areEqual(undefined, undefined)).toBe(true);
	});

	// stringifyJson wraps both sides identically as { $number }, so they still match
	test("areEqual equals NaN with NaN (wrapped identically by the $number marker)", () => {
		expect(areEqual(NaN, NaN)).toBe(true);
	});

	// before the $number wrapper both stringified to "null" and compared equal; the wrapper distinguishes them now
	test("areEqual does not equal NaN with null (the $number wrapper no longer collapses to null)", () => {
		expect(areEqual<unknown>(NaN, null)).toBe(false);
	});

	// stringifyJson wraps -0 as { $number:"-0" } while +0 stringifies to "0"
	test("areEqual does not equal 0 with -0 (the $number wrapper distinguishes signed zero)", () => {
		expect(areEqual(0, -0)).toBe(false);
	});

	test("areEqual equals -0 with -0", () => {
		expect(areEqual(-0, -0)).toBe(true);
	});

	// dates compare by their stringified ISO value
	test("areEqual equals Dates with the same time", () => {
		expect(areEqual(new Date(100), new Date(100))).toBe(true);
	});

	test("areEqual does not equal Dates with different times", () => {
		expect(areEqual(new Date(100), new Date(200))).toBe(false);
	});

	// bigints compare by their stringified value
	test("areEqual equals equal bigints", () => {
		expect(areEqual(1n, 1n)).toBe(true);
	});

	test("areEqual does not equal a bigint with its numeric string", () => {
		expect(areEqual<unknown>(1n, "1")).toBe(false);
	});

	test("areEqual equals arrays with the same order", () => {
		expect(areEqual([1, 2], [1, 2])).toBe(true);
	});

	test("areEqual does not equal reordered arrays (arrays are order sensitive)", () => {
		expect(areEqual([1, 2], [2, 1])).toBe(false);
	});

	test("areEqual ignores a keyPath three levels deep", () => {
		expect(areEqual<Record<string, unknown>>({ x:{ y:{ z:1, w:2 } } }, { x:{ y:{ z:9, w:2 } } }, { ignore:["x.y.z"] })).toBe(true);
	});

	test("areEqual fails when the ignored keyPath does not match the differing key", () => {
		expect(areEqual<Record<string, unknown>>({ x:{ y:{ z:1, w:2 } } }, { x:{ y:{ z:9, w:2 } } }, { ignore:["x.y.q"] })).toBe(false);
	});

	test("areEqual ignores a keyPath that navigates through an array index", () => {
		expect(areEqual<Record<string, unknown>>({ list:[{ x:1 }] }, { list:[{ x:2 }] }, { ignore:["list.0.x"] })).toBe(true);
	});

	test("areEqual treats a nested missing key as key:undefined", () => {
		expect(areEqual<Record<string, unknown>>({ x:{ a:undefined } }, { x:{} })).toBe(true);
	});

	// both functions stringify to undefined, so any two functions are equal
	test("areEqual equals any two functions (both stringify to undefined)", () => {
		expect(areEqual<unknown>(() => {}, () => {})).toBe(true);
	});

	// a function-valued key disappears on stringify, leaving an empty object
	test("areEqual equals { f:fn } with {}", () => {
		expect(areEqual<Record<string, unknown>>({ f:() => {} }, {})).toBe(true);
	});

	// strict short-circuits before the ignore list is consulted, so order differences still fail
	test("areEqual fails on reordered keys under strict even when the differing key is ignored", () => {
		expect(areEqual({ a:1, b:2 }, { b:2, a:1 }, { strict:true, ignore:["a"] })).toBe(false);
	});

	// a bare ignore key only matches at the root; filterIgnoreKeyPaths drops it when descending
	test("areEqual ignores a bare key only at the root, not the same-named key nested inside", () => {
		expect(areEqual<Record<string, unknown>>({ x:{ a:1, u:2 } }, { x:{ a:1 } }, { ignore:["u"] })).toBe(false);
	});

	test("areEqual strict does not equal differing primitives (short-circuits before the primitive check)", () => {
		expect(areEqual(1, 2, { strict:true })).toBe(false);
	});

});
