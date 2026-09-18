import { redactContent, tagLiterals } from "../../../build/index.js";
import { getTests } from "./data.mjs";

describe("string", () => {
	describe("redact", () => {
		describe("redactContent", () => {

			const tests = getTests("redactContent");

			tests.forEach(({ input, expected, char, complete, options }) => {
				test(tagLiterals`redactContent(${input}) === ${expected}`, () => {
					expect(redactContent(input)).toBe(expected);
				});
				if (char) {
					const { expected:exp=expected, ...opts } = char;
					test(tagLiterals`redactContent(${input}, ${opts.char}) === ${exp}`, () => {
						expect(redactContent(input, opts.char)).toBe(exp);
					});
					test(tagLiterals`redactContent(${input}, ${opts}) === ${exp}`, () => {
						expect(redactContent(input, opts)).toBe(exp);
					});
				}
				if (complete) {
					const { expected:exp=expected, ...opts } = complete;
					test(tagLiterals`redactContent(${input}, ${opts}) === ${exp}`, () => {
						expect(redactContent(input, opts)).toBe(exp);
					});
				}
				if (options) {
					const { expected:exp=expected, ...opts } = options;
					if (opts.contentChar) opts.codeBlocks = { ...opts };
					if (opts.keyChar) opts.keyValuePairs = { ...opts };
					if (opts.labelChar) opts.mdLinks = { ...opts };
					test(tagLiterals`redactContent(${input}, ${opts}) === ${exp}`, () => {
						expect(redactContent(input, opts)).toBe(exp);
					});
				}
			});

		});
	});
});
