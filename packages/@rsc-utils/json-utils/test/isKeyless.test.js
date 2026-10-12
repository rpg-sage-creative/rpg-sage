import { isKeyless, stringifyJson } from "../build/index.js";
import { getTests } from "./data.js";

describe("json", () => {
	describe("isKeyless", () => {

		/** @type {{ object:object; empty:boolean; keyless:boolean; }[]} */
		const tests = getTests("isKeyless");

		tests.forEach(({ object, keyless }) => {
			test(`isKeyless(${stringifyJson(object)}) === ${keyless}`, () => {
				expect(isKeyless(object)).toBe(keyless);
			})
		});

	});
});
