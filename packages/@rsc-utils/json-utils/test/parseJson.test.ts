import { describe, expect, test } from "vitest";
import { parseJson } from "../build/index.js";

const date = new Date("2020-06-01T12:34:56.789Z");
const dateString = date.toISOString();

describe("parseJson", () => {

	// single-key $bigint wrappers convert to bigints

	test("parseJson converts a top-level bigint wrapper to a bigint", () => {
		expect(parseJson(JSON.stringify({ $bigint:"1" }))).toBe(1n);
	});

	test("parseJson converts a top-level date wrapper to a Date", () => {
		expect(parseJson(JSON.stringify({ $date:dateString }))).toEqual(date);
	});

	test("parseJson converts a bigint property", () => {
		const text = JSON.stringify({ a:"Apple", b:{ $bigint:"1" } });
		const parsed = parseJson<{ a:string; b:bigint }>(text);
		expect(parsed).toEqual({ a:"Apple", b:1n });
		expect(typeof parsed.b).toBe("bigint");
	});

	test("parseJson converts a date property", () => {
		const text = JSON.stringify({ a:"Apple", d:{ $date:dateString } });
		const parsed = parseJson<{ a:string; d:Date }>(text);
		expect(parsed).toEqual({ a:"Apple", d:date });
	});

	test("parseJson converts bigint wrappers inside arrays", () => {
		const text = JSON.stringify([{ $bigint:"1" }, { $bigint:"2" }, { $bigint:"3" }]);
		expect(parseJson(text)).toEqual([1n, 2n, 3n]);
	});

	test("parseJson converts date wrappers inside arrays", () => {
		const text = JSON.stringify([{ $date:dateString }, { $date:dateString }, { $date:dateString }]);
		expect(parseJson(text)).toEqual([date, date, date]);
	});

	// the guard requires a single-key object, so look-alikes are left alone

	test("parseJson does not convert an object that has $bigint alongside other keys", () => {
		const text = JSON.stringify({ a:"Apple", $bigint:"1" });
		expect(parseJson(text)).toStrictEqual({ a:"Apple", $bigint:"1" });
	});

	test("parseJson does not convert an object that has $date alongside other keys", () => {
		const text = JSON.stringify({ a:"Apple", $date:dateString });
		expect(parseJson(text)).toStrictEqual({ a:"Apple", $date:dateString });
	});

	// but a single-key wrapper nested inside a multi-key parent still converts
	test("parseJson converts an inner bigint wrapper even when the parent has other keys", () => {
		const parsed = parseJson<{ a:bigint; b:number }>('{"a":{"$bigint":"1"},"b":2}');
		expect(parsed).toEqual({ a:1n, b:2 });
	});

	test("parseJson leaves a $bigint wrapper with a non-string value unconverted", () => {
		expect(parseJson('{"$bigint":5}')).toStrictEqual({ $bigint:5 });
	});

	// single-key $number wrappers restore the numbers JSON cannot represent

	test("parseJson restores the four $number payloads with exact identity", () => {
		expect(Object.is(parseJson('{"$number":"-0"}'), -0)).toBe(true);
		expect(Number.isNaN(parseJson('{"$number":"NaN"}'))).toBe(true);
		expect(parseJson('{"$number":"Infinity"}')).toBe(Infinity);
		expect(parseJson('{"$number":"-Infinity"}')).toBe(-Infinity);
	});

	// the exact-payload match leaves look-alike user data alone
	test("parseJson leaves a $number payload outside the exact set unconverted", () => {
		expect(parseJson('{"$number":"5"}')).toStrictEqual({ $number:"5" });
	});

	test("parseJson does not unwrap $number alongside other keys", () => {
		expect(parseJson('{"x":1,"$number":"NaN"}')).toStrictEqual({ x:1, $number:"NaN" });
	});

	test("parseJson preserves null values", () => {
		const text = JSON.stringify({ a:"Apple", b:null });
		expect(parseJson(text)).toStrictEqual({ a:"Apple", b:null });
	});

	// stringifyJson drops undefined-valued keys before parse ever sees them
	test("parseJson parses the serialized form of an undefined key as a missing key", () => {
		const text = JSON.stringify({ a:"Apple", b:undefined });
		expect(text).toBe('{"a":"Apple"}');
		expect(Object.hasOwn(parseJson(text), "b")).toBe(false);
	});

	test("parseJson applies a reviver", () => {
		const doubled = parseJson('{"a":1}', (_key:string, value:unknown) => typeof value === "number" ? value * 2 : value);
		expect(doubled).toEqual({ a:2 });
	});

	test("parseJson converts bigints before the reviver sees them", () => {
		const parsed = parseJson('{"n":{"$bigint":"9"}}', (_key:string, value:unknown) => typeof value === "bigint" ? `${value}n` : value);
		expect(parsed).toEqual({ n:"9n" });
	});

	test("parseJson throws a SyntaxError on invalid JSON", () => {
		expect(() => parseJson("{oops")).toThrow(SyntaxError);
	});

	test("parseJson creates an Invalid Date from a bad $date string", () => {
		const parsed = parseJson<{ d:Date }>('{"d":{"$date":"not-a-date"}}');
		expect(parsed.d.getTime()).toBeNaN();
	});

});
