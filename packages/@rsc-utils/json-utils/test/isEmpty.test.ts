import { describe, expect, test } from "vitest";
import { isEmpty, stringifyJson } from "../build/index.js";
import { getTests } from "./data.ts";

describe("json", () => {
	describe("isEmpty", () => {

		const tests = getTests("isEmpty");

		tests.forEach(({ object, empty }) => {
			test(`isEmpty(${stringifyJson(object)}) === ${empty}`, () => {
				expect(isEmpty(object)).toBe(empty);
			})
		});

	});
});
