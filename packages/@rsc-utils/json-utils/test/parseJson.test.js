import { parseJson } from "../build/index.js";
import { getTests } from "./data.js";

describe("json", () => {
	describe("parseJson", () => {

		/** @type {{ object:object; string:string; label:string; }[]} */
		const tests = getTests("parseJson");

		tests.forEach(({ object, string, label }) => {
			test(`parseJson(${(string)}) equals ${label}`, () => {
				expect(parseJson(string)).toEqual(object);
			});
		});

	});
});
