import { quote, tagLiterals } from "../../../build/index.js";
import { getTests } from "./data.js";

describe("string", () => {
	describe("quotes", () => {
		describe("quote", () => {

			const tests = getTests("quote");
			tests.forEach(({unquoted, style, quoted}) => {
				test(tagLiterals`quote(${unquoted}, ${style}) === ${quoted}`, () => {
					expect(quote(unquoted, style)).toBe(quoted);
				});
			});

		});
	});
});
