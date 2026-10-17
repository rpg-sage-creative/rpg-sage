import { tagLiterals } from "@rsc-tools/dev-scripts";
import { quote } from "../build/index.js";
import { getTests } from "./data.js";

describe("quote", () => {

	const tests = getTests("quote");
	tests.forEach(({unquoted, style, quoted}) => {
		test(tagLiterals`quote(${unquoted}, ${style}) === ${quoted}`, () => {
			expect(quote(unquoted, style)).toBe(quoted);
		});
	});

});
