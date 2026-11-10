import { stringifyJson } from "../build/index.js";
import { getTests } from "./data.ts";
import { describe, test, expect } from "vitest";

describe("json", () => {
	describe("stringifyJson", () => {

		const tests = getTests("stringifyJson");

		tests.forEach(({ object, string, label, stringifyReplacer, stringifySpace, stringifyMaxLineLength }) => {
			test(`stringifyJson("${label}") === ${string}`, () => {
				expect(stringifyJson(object, stringifyReplacer as null, stringifySpace, stringifyMaxLineLength)).toBe(string);
			});
		});

		test("stringifyJson uses a function replacer", () => {
			expect(stringifyJson({ a:1, b:2 }, (key:string, value:unknown) => key === "b" ? undefined : value)).toBe('{"a":1}');
		});

		test("stringifyJson filters keys with an array replacer", () => {
			expect(stringifyJson({ a:1, b:2 }, ["a"])).toBe('{"a":1}');
			expect(stringifyJson({ a:{ x:1, y:2 }, b:3 }, ["a", "x"])).toBe('{"a":{"x":1}}');
		});

		test("stringifyJson formats the output with space", () => {
			expect(stringifyJson({ a:1 }, null, 2)).toBe('{\n  "a": 1\n}');
		});

		// JSON.stringify(undefined) returns undefined instead of a string
		test("stringifyJson(undefined) returns undefined", () => {
			expect(stringifyJson(undefined)).toBeUndefined();
		});

	});
});
