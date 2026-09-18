import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { HorizontalWhitespaceRegExp, HorizontalWhitespaceRegExpG, WhitespaceRegExp, WhitespaceRegExpG } from "../../build/index.js";

describe("string", () => {
	describe("whitespace", () => {

		const tests = [
			// basic space tests
			{ input:" ", regex:WhitespaceRegExp, expectedExecResults:[" "] },
			{ input:" ", regex:WhitespaceRegExpG, expectedExecResults:[" "] },
			{ input:" ", regex:HorizontalWhitespaceRegExp, expectedExecResults:[" "] },
			{ input:" ", regex:HorizontalWhitespaceRegExpG, expectedExecResults:[" "] },

			// basic newline tests
			{ input:"\n", regex:WhitespaceRegExp, expectedExecResults:["\n"] },
			{ input:"\n", regex:WhitespaceRegExpG, expectedExecResults:["\n"] },
			{ input:"\n", regex:HorizontalWhitespaceRegExp, expectedExecResults:null },
			{ input:"\n", regex:HorizontalWhitespaceRegExpG, expectedExecResults:null },

			{ input:"b\n  \rb", regex:WhitespaceRegExp, expectedExecResults:["\n  \r"] },
			{ input:"b\n  \rb", regex:WhitespaceRegExpG, expectedExecResults:["\n  \r"] },
			{ input:"b\n  \rb", regex:HorizontalWhitespaceRegExp, expectedExecResults:["  "] },
			{ input:"b\n  \rb", regex:HorizontalWhitespaceRegExpG, expectedExecResults:["  "] },

			// { input:"", options:{ }, expectedSource:"", expectedTestResults:false, expectedExecResults:[] },
		];

		tests.forEach(({ input, regex, expectedExecResults }) => {
			describe(tagLiterals`${input} vs ${regex}`, () => {

				test(tagLiterals`${regex}.test(${input}) === ${!!expectedExecResults}`, () => {
					regex.lastIndex = 0;
					expect(regex.test(input)).toBe(!!expectedExecResults);
				});

				test(tagLiterals`${regex}.exec(${input}) equals ${expectedExecResults}`, () => {
					regex.lastIndex = 0;
					if (expectedExecResults === null) {
						expect(regex.exec(input)).toBeNull();
					}else {
						// we use String() casting here because the RegExpExecArray doesn't have the same properties as a simple Array
						expect(String(regex.exec(input))).toBe(String(expectedExecResults));
					}
				});

			});
		});
	});
});