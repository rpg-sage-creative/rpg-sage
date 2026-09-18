import { dequote, tagLiterals } from "../../../build/index.js";
import { getTests } from "./data.js";

describe("string", () => {
	describe("dequote", () => {

		const tests = getTests("dequote");
		tests.forEach(({ quoted, style, contents, unquoted }) => {
			const options = { style, contents };
			test(tagLiterals`dequote(${quoted}, ${options}) === ${unquoted}`, () => {
				expect(dequote(quoted, options)).toBe(unquoted);
			});
		});

	});
});