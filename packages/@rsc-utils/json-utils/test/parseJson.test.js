import { tagLiterals } from "@rsc-utils//template-literal-utils";
import { parseJson } from "../build/index.js";
import { getTests } from "./data.js";

describe("json", () => {
	describe("parseJson", () => {

		/** @type {{ object:object; string:string; label:string; }[]} */
		const tests = getTests("parseJson");

		tests.forEach(({ object, string, label }) => {
			test(tagLiterals`parseJson(${string}) equals ${label}`, () => {
				expect(parseJson(string)).toEqual(object);
			});
		});

	});
});
