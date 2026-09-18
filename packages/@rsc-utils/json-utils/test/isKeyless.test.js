import { tagLiterals } from "@rsc-utils//template-literal-utils";
import { isKeyless } from "../build/index.js";
import { getTests } from "./data.js";

describe("json", () => {
	describe("isKeyless", () => {

		/** @type {{ object:object; empty:boolean; keyless:boolean; }[]} */
		const tests = getTests("isKeyless");

		tests.forEach(({ object, empty, keyless }) => {
			test(tagLiterals`isKeyless(${object}) === ${keyless}`, () => {
				expect(isKeyless(object)).toBe(keyless);
			})
		});

	});
});
