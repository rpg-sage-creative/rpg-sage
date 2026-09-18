import { redactMdLinks, tagLiterals } from "../../../build/index.js";
import { getTests } from "./data.mjs";

describe("string", () => {
	describe("redact", () => {
		describe("redactMdLinks", () => {

			const tests = getTests("redactMdLinks");

			tests.forEach(({ input, expected, char, complete, options }) => {
				test(tagLiterals`redactMdLinks(${input}) === ${expected}`, () => {
					expect(redactMdLinks(input)).toBe(expected);
				});
				if (char) {
					const { expected:exp=expected, ...opts } = char;
					test(tagLiterals`redactMdLinks(${input}, ${opts.char}) === ${exp}`, () => {
						expect(redactMdLinks(input, opts.char)).toBe(exp);
					});
					test(tagLiterals`redactMdLinks(${input}, ${opts}) === ${exp}`, () => {
						expect(redactMdLinks(input, opts)).toBe(exp);
					});
				}
				if (complete) {
					const { expected:exp=expected, ...opts } = complete;
					test(tagLiterals`redactMdLinks(${input}, ${opts}) === ${exp}`, () => {
						expect(redactMdLinks(input, opts)).toBe(exp);
					});
				}
				if (options) {
					const { expected:exp=expected, ...opts } = options;
					test(tagLiterals`redactMdLinks(${input}, ${opts}) === ${exp}`, () => {
						expect(redactMdLinks(input, opts)).toBe(exp);
					});
				}
			});

		});
	});
});
