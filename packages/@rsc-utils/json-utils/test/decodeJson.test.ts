import { describe, expect, test } from "vitest";
import { decodeJson, encodeJson, parseJson, prettifyJson } from "../build/index.js";

const date = new Date("2020-06-01T12:34:56.789Z");
const dateString = date.toISOString();

describe("decodeJson", () => {

	// single-key $bigint wrappers convert to bigints

	test("decodeJson converts a top-level bigint wrapper to a bigint", () => {
		expect(decodeJson(JSON.stringify({ $bigint:"1" }))).toBe(1n);
	});

	test("decodeJson converts a top-level date wrapper to a Date", () => {
		expect(decodeJson(JSON.stringify({ $date:dateString }))).toEqual(date);
	});

	test("decodeJson converts a bigint property", () => {
		const text = JSON.stringify({ a:"Apple", b:{ $bigint:"1" } });
		const parsed = decodeJson<{ a:string; b:bigint }>(text);
		expect(parsed).toEqual({ a:"Apple", b:1n });
		expect(typeof parsed.b).toBe("bigint");
	});

	test("decodeJson converts a date property", () => {
		const text = JSON.stringify({ a:"Apple", d:{ $date:dateString } });
		const parsed = decodeJson<{ a:string; d:Date }>(text);
		expect(parsed).toEqual({ a:"Apple", d:date });
	});

	test("decodeJson converts bigint wrappers inside arrays", () => {
		const text = JSON.stringify([{ $bigint:"1" }, { $bigint:"2" }, { $bigint:"3" }]);
		expect(decodeJson(text)).toEqual([1n, 2n, 3n]);
	});

	test("decodeJson converts date wrappers inside arrays", () => {
		const text = JSON.stringify([{ $date:dateString }, { $date:dateString }, { $date:dateString }]);
		expect(decodeJson(text)).toEqual([date, date, date]);
	});

	// the guard requires a single-key object, so look-alikes are left alone

	test("decodeJson does not convert an object that has $bigint alongside other keys", () => {
		const text = JSON.stringify({ a:"Apple", $bigint:"1" });
		expect(decodeJson(text)).toStrictEqual({ a:"Apple", $bigint:"1" });
	});

	test("decodeJson does not convert an object that has $date alongside other keys", () => {
		const text = JSON.stringify({ a:"Apple", $date:dateString });
		expect(decodeJson(text)).toStrictEqual({ a:"Apple", $date:dateString });
	});

	// but a single-key wrapper nested inside a multi-key parent still converts
	test("decodeJson converts an inner bigint wrapper even when the parent has other keys", () => {
		const parsed = decodeJson<{ a:bigint; b:number }>('{"a":{"$bigint":"1"},"b":2}');
		expect(parsed).toEqual({ a:1n, b:2 });
	});

	test("decodeJson leaves a $bigint wrapper with a non-string value unconverted", () => {
		expect(decodeJson('{"$bigint":5}')).toStrictEqual({ $bigint:5 });
	});

	// single-key $number wrappers restore the numbers JSON cannot represent

	test("decodeJson restores the four $number payloads with exact identity", () => {
		expect(Object.is(decodeJson('{"$number":"-0"}'), -0)).toBe(true);
		expect(Number.isNaN(decodeJson('{"$number":"NaN"}'))).toBe(true);
		expect(decodeJson('{"$number":"Infinity"}')).toBe(Infinity);
		expect(decodeJson('{"$number":"-Infinity"}')).toBe(-Infinity);
	});

	// the exact-payload match leaves look-alike user data alone
	test("decodeJson leaves a $number payload outside the exact set unconverted", () => {
		expect(decodeJson('{"$number":"5"}')).toStrictEqual({ $number:"5" });
	});

	test("decodeJson does not unwrap $number alongside other keys", () => {
		expect(decodeJson('{"x":1,"$number":"NaN"}')).toStrictEqual({ x:1, $number:"NaN" });
	});

	test("decodeJson preserves null values", () => {
		const text = JSON.stringify({ a:"Apple", b:null });
		expect(decodeJson(text)).toStrictEqual({ a:"Apple", b:null });
	});

	// plain JSON.stringify drops undefined-valued keys before decode ever sees them — only encodeJson's { $undefined } wrapper preserves them (see the round-trip tests below)
	test("decodeJson parses the serialized form of an undefined key as a missing key", () => {
		const text = JSON.stringify({ a:"Apple", b:undefined });
		expect(text).toBe('{"a":"Apple"}');
		expect(Object.hasOwn(decodeJson(text), "b")).toBe(false);
	});

	test("decodeJson applies a reviver", () => {
		const doubled = decodeJson('{"a":1}', (_key:string, value:unknown) => typeof value === "number" ? value * 2 : value);
		expect(doubled).toEqual({ a:2 });
	});

	test("decodeJson converts bigints before the reviver sees them", () => {
		const parsed = decodeJson('{"n":{"$bigint":"9"}}', (_key:string, value:unknown) => typeof value === "bigint" ? `${value}n` : value);
		expect(parsed).toEqual({ n:"9n" });
	});

	test("decodeJson throws a SyntaxError on invalid JSON", () => {
		expect(() => decodeJson("{oops")).toThrow(SyntaxError);
	});

	test("decodeJson creates an Invalid Date from a bad $date string", () => {
		const parsed = decodeJson<{ d:Date }>('{"d":{"$date":"not-a-date"}}');
		expect(parsed.d.getTime()).toBeNaN();
	});

	// the deprecated alias is the same function object

	test("parseJson is a deprecated alias of decodeJson", () => {
		expect(parseJson).toBe(decodeJson);
		expect(parseJson('{"n":{"$bigint":"9"}}')).toEqual({ n:9n });
	});

});

describe("decodeJson encodeJson round-trips", () => {

	// keys are pre-encoded symmetrically with values, so raw strings never hit JSON.parse twice

	test("a Map with string keys round-trips intact", () => {
		const map = new Map<string, unknown>([["stunned", true], ["doomed", 1]]);
		expect(decodeJson(encodeJson(map))).toEqual(map);
	});

	test("a Map preserves Date, bigint, NaN, undefined, and JSON-looking string keys", () => {
		const map = new Map<unknown, string>([[date, "d"], [7n, "b"], [NaN, "nan"], [-0, "z"], [undefined, "u"], ['{"a":1}', "j"]]);
		const entries = [...(decodeJson<Map<unknown, string>>(encodeJson(map))).entries()];
		expect(entries.map(([key]) => key)).toEqual([date, 7n, NaN, 0, undefined, '{"a":1}']);
		// Map keys normalize -0 to +0 via SameValueZero — the ORIGINAL map stores +0 too, so this is not an encode/decode loss
		expect(Object.is(entries[3][0], [...map.keys()][3])).toBe(true);
	});

	test("a Set preserves mixed values incl. Date, bigint, and undefined", () => {
		const set = new Set(["a", date, 7n, NaN, -0, undefined]);
		expect(decodeJson(encodeJson(set))).toEqual(set);
	});

	test("nested Maps/Sets inside objects round-trip intact", () => {
		const deep = new Set([date, 5n, "x"]);
		const inner = new Map([["deep", deep]]);
		const object = { m:new Map([["inner", inner]]), s:new Set(["t"]), d:date };
		expect(decodeJson(encodeJson(object))).toEqual(object);
	});

	test("Map values restore as real Dates and bigints, not wrapper objects", () => {
		const map = new Map([["o", { x:1, d:date }], ["a", [date, 2n]]]);
		const restored = decodeJson<Map<string, any>>(encodeJson(map));
		expect(restored.get("o").d).toBeInstanceOf(Date);
		expect(typeof restored.get("a")[1]).toBe("bigint");
	});

	// { $undefined } is restored by a post-parse walk — reviver returns would delete keys and null array slots

	test("an undefined-valued object key survives the round-trip with the key present", () => {
		const cloned = decodeJson<{ a:string; b?:unknown }>(encodeJson({ a:"Apple", b:undefined }));
		expect(Object.hasOwn(cloned, "b")).toBe(true);
		expect(cloned.b).toBeUndefined();
	});

	test("an undefined array slot survives the round-trip as a defined index", () => {
		const restored = decodeJson<unknown[]>(encodeJson([undefined, 1]));
		expect(0 in restored).toBe(true);
		expect(restored[0]).toBeUndefined();
	});

	test("a function Map value degrades to undefined instead of crashing the decode", () => {
		const map = new Map<string, unknown>([["f", () => {}]]);
		const restored = decodeJson<Map<string, unknown>>(encodeJson(map));
		expect(restored.get("f")).toBeUndefined();
	});

	test("root-level undefined keeps the legacy contract: encode returns JS undefined, not a wrapper string", () => {
		expect(encodeJson(undefined)).toBeUndefined();
	});

	test("prettifyJson output decodes back to the original value", () => {
		const object = { m:new Map([["k", [date, undefined]]]), s:new Set(["t"]) };
		expect(decodeJson(prettifyJson(object))).toEqual(object);
	});

});
