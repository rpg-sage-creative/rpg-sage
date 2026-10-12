import { isEmpty, stringifyJson } from "../build/index.js";
import { getTests } from "./data.js";

describe("json", () => {
	describe("isEmpty", () => {

		/** @type {{ object:object; empty:boolean; keyless:boolean; }[]} */
		const tests = getTests("isEmpty");

		tests.forEach(({ object, empty }) => {
			test(`isEmpty(${stringifyJson(object)}) === ${empty}`, () => {
				expect(isEmpty(object)).toBe(empty);
			})
		});

	});
});
