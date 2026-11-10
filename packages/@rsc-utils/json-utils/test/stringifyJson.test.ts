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

	});
});
