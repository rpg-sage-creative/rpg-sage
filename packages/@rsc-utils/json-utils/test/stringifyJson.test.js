import { tagLiterals } from "@rsc-utils//template-literal-utils";
import { stringifyJson } from "../build/index.js";
import { getTests } from "./data.js";

describe("json", () => {
	describe("stringifyJson", () => {

		/** @type {{ object:object; string:string; label:string; stringifyReplacer?:Function|(string|number)[]|null; stringifySpace?:string|number; stringifyMaxLineLength?:number; }[]} */
		const tests = getTests("stringifyJson");

		tests.forEach(({ object, string, label, stringifyReplacer, stringifySpace, stringifyMaxLineLength }) => {
			test(tagLiterals`stringifyJson(${label}) === ${string}`, () => {
				expect(stringifyJson(object, stringifyReplacer, stringifySpace, stringifyMaxLineLength)).toBe(string);
			});
		});

	});
});
