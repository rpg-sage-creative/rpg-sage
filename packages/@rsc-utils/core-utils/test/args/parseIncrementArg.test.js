import { parseIncrementArg, tagLiterals } from "../../build/index.js";
import { getTests } from "./data.js";

describe("args", () => {
	describe("parseIncrementArg", () => {

		const tests = getTests("parseIncrementArg");
		tests.forEach(({ input, expected }) => {
			test(tagLiterals`parseIncrementArg(${input})`, () => {
				expect(parseIncrementArg(input)).toEqual(expected);
			});
		});

	});
});
