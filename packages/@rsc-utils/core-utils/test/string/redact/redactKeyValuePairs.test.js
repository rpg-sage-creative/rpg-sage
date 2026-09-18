import { redactKeyValuePairs, tagLiterals } from "../../../build/index.js";
import { getTests } from "./data.mjs";

describe("string", () => {
	describe("redact", () => {
		describe("redactKeyValuePairs", () => {

			const tests = getTests("redactKeyValuePairs");

			tests.forEach(({ input, expected, char, complete, options }) => {
				test(tagLiterals`redactKeyValuePairs(${input}) === ${expected}`, () => {
					expect(redactKeyValuePairs(input)).toBe(expected);
				});
				if (char) {
					const { expected:exp=expected, ...opts } = char;
					test(tagLiterals`redactKeyValuePairs(${input}, ${opts.char}) === ${exp}`, () => {
						expect(redactKeyValuePairs(input, opts.char)).toBe(exp);
					});
					test(tagLiterals`redactKeyValuePairs(${input}, ${opts}) === ${exp}`, () => {
						expect(redactKeyValuePairs(input, opts)).toBe(exp);
					});
				}
				if (complete) {
					const { expected:exp=expected, ...opts } = complete;
					test(tagLiterals`redactKeyValuePairs(${input}, ${opts}) === ${exp}`, () => {
						expect(redactKeyValuePairs(input, opts)).toBe(exp);
					});
				}
				if (options) {
					const { expected:exp=expected, ...opts } = options;
					test(tagLiterals`redactKeyValuePairs(${input}, ${opts}) === ${exp}`, () => {
						expect(redactKeyValuePairs(input, opts)).toBe(exp);
					});
				}
			});

		});
	});
});
