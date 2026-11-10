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

	});
});
