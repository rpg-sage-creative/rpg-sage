import { describe, expect, test } from "vitest";
import { parseJson } from "../build/index.js";
import { getTests } from "./data.ts";

describe("json", () => {
	describe("parseJson", () => {

		const tests = getTests("parseJson");

		tests.forEach(({ object, string, label }) => {
			test(`parseJson(${(string)}) equals ${label}`, () => {
				expect(parseJson(string)).toEqual(object);
			});
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
});
