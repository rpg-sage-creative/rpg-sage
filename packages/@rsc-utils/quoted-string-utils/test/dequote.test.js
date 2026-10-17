import { tagLiterals } from "@rsc-tools/dev-scripts";
import { dequote } from "../build/index.js";
import { getTests } from "./data.js";

const tests = getTests("dequote");
tests.forEach(({ quoted, style, contents, unquoted }) => {
	const options = { style, contents };
	test(tagLiterals`dequote(${quoted}, ${options}) === ${unquoted}`, () => {
		expect(dequote(quoted, options)).toBe(unquoted);
	});
});
