import { tagLiterals } from "@rsc-utils/type-utils";
import { isEmpty } from "../build/index.js";
import { getTests } from "./data.js";

describe("json", () => {
	describe("isEmpty", () => {

		/** @type {{ object:object; empty:boolean; keyless:boolean; }[]} */
		const tests = getTests("isEmpty");

		tests.forEach(({ object, empty, keyless }) => {
			test(tagLiterals`isEmpty(${object}) === ${empty}`, () => {
				expect(isEmpty(object)).toBe(empty);
			})
		});

	});
});
