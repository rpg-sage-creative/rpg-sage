import { describe, expect, test } from "vitest";
import { stringifyJson } from "../build/index.js";

const date = new Date("2020-06-01T12:34:56.789Z");
const dateString = date.toISOString();

describe("stringifyJson", () => {

	// bigint and date handling

	test("stringifyJson wraps a top-level bigint as { $bigint }", () => {
		expect(stringifyJson(1n)).toBe(JSON.stringify({ $bigint:"1" }));
	});

	test("stringifyJson wraps a top-level Date as { $date }", () => {
		expect(stringifyJson(date)).toBe(JSON.stringify({ $date:dateString }));
	});

	test("stringifyJson wraps a bigint property", () => {
		expect(stringifyJson({ a:"Apple", b:1n })).toBe(JSON.stringify({ a:"Apple", b:{ $bigint:"1" } }));
	});

	test("stringifyJson wraps a Date property", () => {
		expect(stringifyJson({ a:"Apple", d:date })).toBe(JSON.stringify({ a:"Apple", d:{ $date:dateString } }));
	});

	test("stringifyJson wraps bigints inside arrays", () => {
		expect(stringifyJson([1n, 2n, 3n])).toBe(JSON.stringify([{ $bigint:"1" }, { $bigint:"2" }, { $bigint:"3" }]));
	});

	test("stringifyJson wraps Dates inside arrays", () => {
		expect(stringifyJson([date, date, date])).toBe(JSON.stringify([{ $date:dateString }, { $date:dateString }, { $date:dateString }]));
	});

	// the wrapper only fires on real bigint/date values, not on look-alike strings
	test("stringifyJson leaves a $bigint string property alone", () => {
		expect(stringifyJson({ a:"Apple", $bigint:"1" })).toBe(JSON.stringify({ a:"Apple", $bigint:"1" }));
	});

	test("stringifyJson leaves a $date string property alone", () => {
		expect(stringifyJson({ a:"Apple", $date:dateString })).toBe(JSON.stringify({ a:"Apple", $date:dateString }));
	});

	// JSON cannot represent these numbers, so they wrap for lossless parseJson restore

	test("stringifyJson wraps NaN as { $number }", () => {
		expect(stringifyJson(NaN)).toBe('{"$number":"NaN"}');
	});

	test("stringifyJson wraps -0 but not +0", () => {
		expect(stringifyJson(-0)).toBe('{"$number":"-0"}');
		expect(stringifyJson(0)).toBe("0");
	});

	test("stringifyJson wraps ±Infinity with signed payloads", () => {
		expect(stringifyJson(Infinity)).toBe('{"$number":"Infinity"}');
		expect(stringifyJson(-Infinity)).toBe('{"$number":"-Infinity"}');
	});

	test("stringifyJson wraps non-finite numbers nested in objects", () => {
		expect(stringifyJson({ a:-0, b:NaN, c:Infinity })).toBe('{"a":{"$number":"-0"},"b":{"$number":"NaN"},"c":{"$number":"Infinity"}}');
	});

	// standard JSON behavior

	test("stringifyJson preserves null values", () => {
		expect(stringifyJson({ a:"Apple", b:null })).toBe('{"a":"Apple","b":null}');
	});

	// JSON.stringify drops undefined-valued keys
	test("stringifyJson drops keys with undefined values", () => {
		expect(stringifyJson({ a:"Apple", b:undefined })).toBe('{"a":"Apple"}');
	});

	// JSON.stringify(undefined) returns undefined instead of a string
	test("stringifyJson(undefined) returns undefined", () => {
		expect(stringifyJson(undefined)).toBeUndefined();
	});

	// replacers

	test("stringifyJson uses a function replacer", () => {
		expect(stringifyJson({ a:1, b:2 }, (key:string, value:unknown) => key === "b" ? undefined : value)).toBe('{"a":1}');
	});

	test("stringifyJson filters keys with an array replacer", () => {
		expect(stringifyJson({ a:1, b:2 }, ["a"])).toBe('{"a":1}');
		expect(stringifyJson({ a:{ x:1, y:2 }, b:3 }, ["a", "x"])).toBe('{"a":{"x":1}}');
	});

	// unlisted array indices serialize as null (standard JSON.stringify array-replacer behavior)
	test("stringifyJson nulls out array indices missing from an array replacer", () => {
		expect(stringifyJson([1, 2, 3], ["0", "2"])).toBe("[1,null,3]");
	});

	// the bigint/date wrap happens before a user function replacer is consulted for those keys
	test("stringifyJson wraps bigint and date even when a function replacer is given", () => {
		const seen:string[] = [];
		const out = stringifyJson({ b:5n, d:date }, (key:string, value:unknown) => {
			seen.push(key);
			return value;
		});
		expect(out).toBe(JSON.stringify({ b:{ $bigint:"5" }, d:{ $date:dateString } }));
		// the user replacer never receives the raw bigint/date keys, only their wrapper properties
		expect(seen).toStrictEqual(["", "$bigint", "$date"]);
	});

	// space / maxLineLength formatting

	test("stringifyJson formats the output with space", () => {
		expect(stringifyJson({ a:1 }, null, 2)).toBe('{\n  "a": 1\n}');
	});

	test("stringifyJson with space=2 keeps simple objects pretty (no maxLineLength)", () => {
		expect(stringifyJson({ a:"Apple" }, null, 2)).toBe('{\n  "a": "Apple"\n}');
	});

	test("stringifyJson inlines a short object on one line with maxLineLength", () => {
		const object = { one:"One", two:2 };
		expect(stringifyJson(object, null, undefined, 250)).toBe('{ "one": "One", "two": 2 }');
	});

	test("stringifyJson inlines a short array but keeps the outer object multiline", () => {
		const object = { one:"One", two:[2, 3, 4] };
		expect(stringifyJson(object, null, undefined, 250)).toBe('{\n\t"one": "One",\n\t"two": [ 2, 3, 4 ]\n}');
	});

	test("stringifyJson inlines only the innermost short containers (nested braces stay multiline)", () => {
		const object = { one:"One", two:["2", { three:[3] }], four:"4" };
		expect(stringifyJson(object, null, undefined, 250)).toBe('{\n\t"one": "One",\n\t"two": [\n\t\t"2",\n\t\t{\n\t\t\t"three": [ 3 ]\n\t\t}\n\t],\n\t"four": "4"\n}');
	});

	// maxLineLength > 0 forces space to "\t" when space is falsy, including an explicit 0
	test("stringifyJson overrides an explicit space=0 with a tab when maxLineLength is given", () => {
		expect(stringifyJson({ a:1 }, null, 0, 50)).toBe('{ "a": 1 }');
	});

	// the inline regexes also match brace/bracket pairs inside string values and collapse their whitespace
	test("stringifyJson maxLineLength collapses whitespace inside braces in string values (quirk)", () => {
		expect(stringifyJson({ a:"x{ y   z }w" }, null, 2, 80)).toBe('{\n  "a": "x{ y z }w"\n}');
	});

	test("stringifyJson maxLineLength collapses whitespace inside brackets in string values (quirk)", () => {
		expect(stringifyJson({ a:"p[ q   r ]s" }, null, 2, 80)).toBe('{\n  "a": "p[ q r ]s"\n}');
	});

});
