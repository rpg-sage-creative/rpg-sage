import { describe, expect, test } from "vitest";
import { isKeyless, stringifyJson } from "../build/index.js";
import { getTests } from "./data.ts";

describe("json", () => {
	describe("isKeyless", () => {

		const tests = getTests("isKeyless");

		tests.forEach(({ object, keyless }) => {
			test(`isKeyless(${stringifyJson(object)}) === ${keyless}`, () => {
				expect(isKeyless(object)).toBe(keyless);
			})
		});

	});
});
