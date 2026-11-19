import { describe, expect, test } from "vitest";
import { uncache } from "../build/index.js";

describe("uncache", () => {

	test(`no options: returns null and keeps keys, but clears collection values`, () => {
		const input = { a:"A", b:"B", c:new Set(["A","B"]) };
		expect(uncache(input)).toBeNull();
		expect(input).toEqual({ a:"A", b:"B", c:new Set() });
	});

	test(`nullify: returns null and sets every key to null after clearing`, () => {
		const input = { a:"A", b:"B", c:new Set(["A","B"]) };
		expect(uncache(input, { nullify:true })).toBeNull();
		expect(input).toEqual({ a:null, b:null, c:null });
	});

	test(`undefine: returns undefined and deletes every key`, () => {
		const input = { a:"A", b:"B", c:new Set(["A","B"]) };
		expect(uncache(input, { undefine:true })).toBeUndefined();
		expect(input).toEqual({});
	});

	test(`calls .clear() and .destroy() on the object itself when present`, () => {
		let cleared = 0;
		let destroyed = 0;
		const input = { clear(){ cleared++; }, destroy(){ destroyed++; } };
		expect(uncache(input)).toBeNull();
		expect(cleared).toBe(1);
		expect(destroyed).toBe(1);
	});

	test(`calls .clear() on nested values but leaves non-collection values untouched`, () => {
		const set = new Set([1,2]);
		const input = { set, n:5 };
		uncache(input);
		expect(set.size).toBe(0);
		expect(input.n).toBe(5);
	});

	test(`objects without clear/destroy do not throw`, () => {
		const input = { plain:{ deep:true } };
		expect(() => uncache(input)).not.toThrow();
	});

	// QUIRK: Object.entries() of a Map/Set is empty, so a Map's ENTRIES are never reached — only its own .clear() runs.
	test(`Map value: its own .clear() runs but map entries are not iterated`, () => {
		const map = new Map([["k", 1]]);
		const input = { map };
		uncache(input);
		expect(map.size).toBe(0);
	});

	test(`primitive inputs return the option-derived sentinel without touching anything`, () => {
		expect(uncache(5)).toBeNull();
		expect(uncache("str")).toBeNull();
		expect(uncache(null)).toBeNull();
		expect(uncache(undefined, { undefine:true })).toBeUndefined();
	});

	test(`nullify on a primitive still returns null (no throw)`, () => {
		expect(uncache(0, { nullify:true })).toBeNull();
	});

});
