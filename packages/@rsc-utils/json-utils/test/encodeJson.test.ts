import { describe, expect, test } from "vitest";
import { encodeJson } from "../build/index.js";

const date = new Date("2020-06-01T12:34:56.789Z");
const dateString = date.toISOString();

describe("encodeJson", () => {

	// bigint and date handling

	test("encodeJson wraps a top-level bigint as { $bigint }", () => {
		expect(encodeJson(1n)).toBe(JSON.stringify({ $bigint:"1" }));
	});

	test("encodeJson wraps a top-level Date as { $date }", () => {
		expect(encodeJson(date)).toBe(JSON.stringify({ $date:dateString }));
	});

	test("encodeJson wraps a bigint property", () => {
		expect(encodeJson({ a:"Apple", b:1n })).toBe(JSON.stringify({ a:"Apple", b:{ $bigint:"1" } }));
	});

	test("encodeJson wraps a Date property", () => {
		expect(encodeJson({ a:"Apple", d:date })).toBe(JSON.stringify({ a:"Apple", d:{ $date:dateString } }));
	});

	test("encodeJson wraps bigints inside arrays", () => {
		expect(encodeJson([1n, 2n, 3n])).toBe(JSON.stringify([{ $bigint:"1" }, { $bigint:"2" }, { $bigint:"3" }]));
	});

	test("encodeJson wraps Dates inside arrays", () => {
		expect(encodeJson([date, date, date])).toBe(JSON.stringify([{ $date:dateString }, { $date:dateString }, { $date:dateString }]));
	});

	// the wrapper only fires on real bigint/date values, not on look-alike strings
	test("encodeJson leaves a $bigint string property alone", () => {
		expect(encodeJson({ a:"Apple", $bigint:"1" })).toBe(JSON.stringify({ a:"Apple", $bigint:"1" }));
	});

	test("encodeJson leaves a $date string property alone", () => {
		expect(encodeJson({ a:"Apple", $date:dateString })).toBe(JSON.stringify({ a:"Apple", $date:dateString }));
	});

	// JSON cannot represent these numbers, so they wrap for lossless decodeJson restore

	test("encodeJson wraps NaN as { $number }", () => {
		expect(encodeJson(NaN)).toBe('{"$number":"NaN"}');
	});

	test("encodeJson wraps -0 but not +0", () => {
		expect(encodeJson(-0)).toBe('{"$number":"-0"}');
		expect(encodeJson(0)).toBe("0");
	});

	test("encodeJson wraps ±Infinity with signed payloads", () => {
		expect(encodeJson(Infinity)).toBe('{"$number":"Infinity"}');
		expect(encodeJson(-Infinity)).toBe('{"$number":"-Infinity"}');
	});

	test("encodeJson wraps non-finite numbers nested in objects", () => {
		expect(encodeJson({ a:-0, b:NaN, c:Infinity })).toBe('{"a":{"$number":"-0"},"b":{"$number":"NaN"},"c":{"$number":"Infinity"}}');
	});

	// undefined values wrap instead of dropping the keys (restored by decodeJson's post-parse walk)

	test("encodeJson wraps keys with undefined values", () => {
		expect(encodeJson({ a:"Apple", b:undefined })).toBe('{"a":"Apple","b":{"$undefined":"undefined"}}');
	});

	test("encodeJson wraps array elements with undefined values", () => {
		expect(encodeJson([undefined, 1])).toBe('[{"$undefined":"undefined"},1]');
	});

	// Maps wrap as key/value pair arrays with BOTH sides pre-encoded (raw "stunned" is not valid JSON for decodeJson)

	test("encodeJson wraps a Map as { $map } of encoded key/value pairs", () => {
		expect(encodeJson(new Map([["k", 1]]))).toBe(JSON.stringify({ $map:[['"k"', "1"]] }));
	});

	test("encodeJson pre-encodes special values inside Maps and Sets", () => {
		expect(encodeJson(new Set(["a", date]))).toBe(JSON.stringify({ $set:['"a"', `{"$date":"${dateString}"}`] }));
	});

	// standard JSON behavior

	test("encodeJson preserves null values", () => {
		expect(encodeJson({ a:"Apple", b:null })).toBe('{"a":"Apple","b":null}');
	});

	// JSON.stringify(undefined) returns undefined instead of a string — the legacy drop-in contract is kept at the root
	test("encodeJson(undefined) returns undefined", () => {
		expect(encodeJson(undefined)).toBeUndefined();
	});

	// functions and symbols at the root also stringify to undefined
	test("encodeJson(function) at the root returns undefined", () => {
		expect(encodeJson(() => {})).toBeUndefined();
	});

	test("encodeJson(symbol) at the root returns undefined", () => {
		expect(encodeJson(Symbol("s"))).toBeUndefined();
	});

	// replacers

	test("encodeJson uses a function replacer", () => {
		expect(encodeJson({ a:1, b:2 }, (key:string, value:unknown) => key === "b" ? undefined : value)).toBe('{"a":1}');
	});

	test("encodeJson filters keys with an array replacer", () => {
		expect(encodeJson({ a:1, b:2 }, ["a"])).toBe('{"a":1}');
		expect(encodeJson({ a:{ x:1, y:2 }, b:3 }, ["a", "x"])).toBe('{"a":{"x":1}}');
	});

	// unlisted array indices serialize as null (standard JSON.stringify array-replacer behavior)
	test("encodeJson nulls out array indices missing from an array replacer", () => {
		expect(encodeJson([1, 2, 3], ["0", "2"])).toBe("[1,null,3]");
	});

	// a replacer that drops the root value makes JSON.stringify return undefined for it too
	test("encodeJson with a replacer that drops the root returns undefined instead of throwing", () => {
		expect(encodeJson({ a:1 }, () => undefined)).toBeUndefined();
	});

	// the bigint/date wrap happens before a user function replacer is consulted for those keys
	test("encodeJson wraps bigint and date even when a function replacer is given", () => {
		const seen:string[] = [];
		const out = encodeJson({ b:5n, d:date }, (key:string, value:unknown) => {
			seen.push(key);
			return value;
		});
		expect(out).toBe(JSON.stringify({ b:{ $bigint:"5" }, d:{ $date:dateString } }));
		// the user replacer never receives the raw bigint/date keys, only their wrapper properties
		expect(seen).toStrictEqual(["", "$bigint", "$date"]);
	});

	// space formatting

	test("encodeJson formats the output with space", () => {
		expect(encodeJson({ a:1 }, null, 2)).toBe('{\n  "a": 1\n}');
	});

	test("encodeJson with space=2 keeps simple objects pretty", () => {
		expect(encodeJson({ a:"Apple" }, null, 2)).toBe('{\n  "a": "Apple"\n}');
	});

	// drop-in contract: for any input WITHOUT a special case in encodeJson (bigint/Date/non-finite-number/-0/undefined/$map/$set wrapping),
	// the output must be identical to JSON.stringify's.
	// uniform sweep over a fixed list — one assertion per value, not distinct-case tests (escapeRegExp precedent).
	const dropInValues:[label:string, value:unknown][] = [
		["null", null],
		["undefined", undefined],
		["true", true],
		["false", false],
		["0", 0],
		["-5", -5],
		["3.14", 3.14],
		["1e21", 1e21],
		["empty string", ""],
		["string w/ quotes, newline, tab, emoji, lone surrogate", "hello \"world\"\n\ttabbed \u{1F600} lone-surrogate:\uD800"],
		["empty object", {}],
		["empty array", []],
		["simple object", { a:1, b:"x" }],
		["nested object/array", { a:{ b:[1,"two",null] }, c:true }],
		["Error object", new Error("boom")],
		["Error w/ enumerable prop", Object.assign(new Error("e"), { code:"X" })],
		["function at root", () => {}],
		["symbol at root", Symbol("s")],
		["symbol-keyed object", { [Symbol("k")]:1 }],
		["boxed String", new String("x")],
		["boxed Number", new Number(5)],
		["toJSON object", { toJSON() { return { a:1 }; } }]
	];

	test("encodeJson is a drop-in for JSON.stringify on every non-special value (default args)", () => {
		for (const [label, value] of dropInValues) {
			expect(encodeJson(value), label).toBe(JSON.stringify(value));
		}
	});

	test("encodeJson is a drop-in for JSON.stringify on every non-special value (space=2 formatting)", () => {
		for (const [label, value] of dropInValues) {
			expect(encodeJson(value, null, 2), label).toBe(JSON.stringify(value, null, 2));
		}
	});

	test("circular structures throw the same TypeError from both", () => {
		const circular:{ self?:unknown } = {};
		circular.self = circular;
		let jsonError:unknown, encodedError:unknown;
		try { JSON.stringify(circular); } catch(err) { jsonError = err; }
		try { encodeJson(circular); } catch(err) { encodedError = err; }
		expect(encodedError).toBeInstanceOf(TypeError);
		expect((encodedError as Error).message).toBe((jsonError as Error).message);
	});

});
