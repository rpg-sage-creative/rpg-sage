import { parseKeyValueArg, tagLiterals } from "../../build/index.js";
import { getTests } from "./data.js";

describe("args", () => {
	describe("parseKeyValueArg", () => {

		const tests = getTests("parseKeyValueArg");
		tests.forEach(({ input, expected }) => {
			test(tagLiterals`parseKeyValueArg(${input})`, () => {
				expect(parseKeyValueArg(input)).toEqual(expected);
			});
		});

	});
});
