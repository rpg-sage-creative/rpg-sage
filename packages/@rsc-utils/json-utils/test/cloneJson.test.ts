import { describe, expect, test } from "vitest";
import { cloneJson } from "../build/index.js";

const date = new Date("2020-06-01T12:34:56.789Z");
const dateString = date.toISOString();

describe("cloneJson", () => {

	test("cloneJson round-trips a simple bigint as a bigint", () => {
		const cloned = cloneJson<bigint>(1n);
		expect(cloned).toBe(1n);
	});

	test("cloneJson round-trips a Date into an equal but distinct Date", () => {
		const cloned = cloneJson<Date>(date);
		expect(cloned).toEqual(date);
		expect(cloned).not.toBe(date);
	});

	test("cloneJson round-trips a bigint property as a bigint", () => {
		const object = { a:"Apple", b:1n };
		const cloned = cloneJson<typeof object>(object);
		expect(cloned).toEqual({ a:"Apple", b:1n });
		expect(typeof cloned.b).toBe("bigint");
		expect(cloned).not.toBe(object);
	});

	test("cloneJson round-trips a Date property into an equal but distinct Date", () => {
		const object = { a:"Apple", d:date };
		const cloned = cloneJson<typeof object>(object);
		expect(cloned).toEqual({ a:"Apple", d:date });
		expect(cloned.d.toISOString()).toBe(dateString);
		expect(cloned.d).not.toBe(date);
	});

	test("cloneJson round-trips an array of bigints as bigints", () => {
		const cloned = cloneJson<[bigint, bigint, bigint]>([1n, 2n, 3n]);
		expect(cloned).toEqual([1n, 2n, 3n]);
		expect(cloned.map(v => typeof v)).toStrictEqual(["bigint", "bigint", "bigint"]);
	});

	test("cloneJson round-trips an array of Dates into equal but distinct Dates", () => {
		const object = [date, date, date];
		const cloned = cloneJson<Date[]>(object);
		expect(cloned).toEqual(object);
		expect(cloned[0]).not.toBe(date);
	});

	// decodeJson only converts single-key wrappers, so a $bigint alongside other keys stays a string
	test("cloneJson keeps an object with a $bigint key as plain data", () => {
		const object = { a:"Apple", $bigint:"1" };
		expect(cloneJson<typeof object>(object)).toStrictEqual({ a:"Apple", $bigint:"1" });
	});

	test("cloneJson keeps an object with a $date key as plain data", () => {
		const object = { a:"Apple", $date:dateString };
		expect(cloneJson<typeof object>(object)).toStrictEqual({ a:"Apple", $date:dateString });
	});

	test("cloneJson preserves null values", () => {
		expect(cloneJson({ a:"Apple", b:null })).toStrictEqual({ a:"Apple", b:null });
	});

	// encodeJson wraps undefined-valued keys and decodeJson restores them, so the clone keeps the key present with an undefined value
	test("cloneJson preserves keys with undefined values", () => {
		const cloned = cloneJson<{ a:string; b?:unknown }>({ a:"Apple", b:undefined });
		expect(Object.hasOwn(cloned, "b")).toBe(true);
		expect(cloned.b).toBeUndefined();
	});

	// the number guard returns top-level NaN as-is instead of null
	test("cloneJson preserves a top-level NaN (short-circuits stringify)", () => {
		expect(Number.isNaN(cloneJson(NaN))).toBe(true);
	});

	// the $number wrapper restores nested NaN losslessly
	test("cloneJson preserves a nested NaN via the $number wrapper", () => {
		expect(cloneJson({ a:NaN })).toStrictEqual({ a:NaN });
	});

	// the number guard returns the input untouched, preserving the sign of -0
	test("cloneJson preserves a top-level -0 (short-circuits stringify)", () => {
		expect(Object.is(cloneJson(-0), -0)).toBe(true);
	});

	// the $number wrapper preserves the sign of nested -0
	test("cloneJson preserves a nested -0 via the $number wrapper", () => {
		const cloned = cloneJson<{ a:number }>({ a:-0 });
		expect(Object.is(cloned.a, -0)).toBe(true);
	});

	// all four JSON-inexpressible numbers survive arbitrary depth
	test("cloneJson preserves non-finite numbers and signed zero at any depth", () => {
		const cloned = cloneJson<{ a:{ b:[number, number, number] } }>({ a:{ b:[-0, NaN, Infinity] } });
		expect(Object.is(cloned.a.b[0], -0)).toBe(true);
		expect(Number.isNaN(cloned.a.b[1])).toBe(true);
		expect(cloned.a.b[2]).toBe(Infinity);
	});

	// the typeof guard covers every number, so all non-finite values survive at the top level
	test("cloneJson preserves top-level ±Infinity (the typeof guard covers every number)", () => {
		expect(cloneJson(Infinity)).toBe(Infinity);
		expect(cloneJson(-Infinity)).toBe(-Infinity);
	});

	// nested numbers now round-trip losslessly through the $number wrapper too
	test("cloneJson preserves a nested Infinity via the $number wrapper", () => {
		expect(cloneJson({ a:Infinity })).toStrictEqual({ a:Infinity });
	});

	// the typeof dispatch returns immutable primitives as their own clone (identity equals the round-trip)

	test("cloneJson returns booleans as-is", () => {
		expect(cloneJson(true)).toBe(true);
		expect(cloneJson(false)).toBe(false);
	});

	test("cloneJson returns strings as-is, including control chars and lone surrogates", () => {
		expect(Object.is(cloneJson("Apple"), "Apple")).toBe(true);
		expect(Object.is(cloneJson("a\u0000b"), "a\u0000b")).toBe(true);
		expect(Object.is(cloneJson("\uD800x"), "\uD800x")).toBe(true);
	});

	test("cloneJson returns bigints as-is, even beyond safe-integer range", () => {
		const huge = 123456789012345678901234567890n;
		expect(Object.is(cloneJson(huge), huge)).toBe(true);
	});

	test("cloneJson(null) returns null via the round-trip path", () => {
		expect(cloneJson(null)).toBeNull();
	});

	// symbol/function have no case in the dispatch, so they fall through and keep throwing like before

	test("cloneJson of a top-level symbol throws a SyntaxError (falls through to parse)", () => {
		expect(() => cloneJson(Symbol("s"))).toThrow(SyntaxError);
	});

	test("cloneJson of a top-level function throws a SyntaxError (falls through to parse)", () => {
		expect(() => cloneJson(() => {})).toThrow(SyntaxError);
	});

	// functions are not serializable, so function-valued keys disappear
	test("cloneJson drops function-valued keys", () => {
		const cloned = cloneJson<Record<string, unknown>>({ f:() => {} });
		expect(cloned).toStrictEqual({});
	});

	test("cloneJson(undefined) throws a SyntaxError", () => {
		expect(() => cloneJson(undefined)).toThrow(SyntaxError);
		expect(() => cloneJson(undefined)).toThrow(/Unexpected identifier/);
	});

});
