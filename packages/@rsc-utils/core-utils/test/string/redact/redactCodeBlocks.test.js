import { redactCodeBlocks, tagLiterals } from "../../../build/index.js";
import { getTests } from "./data.mjs";

describe("string", () => {
	describe("redact", () => {
		describe("redactCodeBlocks", () => {

			const tests = getTests("redactCodeBlocks");

			tests.forEach(({ input, expected, char, complete, options }) => {
				test(tagLiterals`redactCodeBlocks(${input}) === ${expected}`, () => {
					expect(redactCodeBlocks(input)).toBe(expected);
				});
				if (char) {
					const { expected:exp=expected, ...opts } = char;
					test(tagLiterals`redactCodeBlocks(${input}, ${opts.char}) === ${exp}`, () => {
						expect(redactCodeBlocks(input, opts.char)).toBe(exp);
					});
					test(tagLiterals`redactCodeBlocks(${input}, ${opts}) === ${exp}`, () => {
						expect(redactCodeBlocks(input, opts)).toBe(exp);
					});
				}
				if (complete) {
					const { expected:exp=expected, ...opts } = complete;
					test(tagLiterals`redactCodeBlocks(${input}, ${opts}) === ${exp}`, () => {
						expect(redactCodeBlocks(input, opts)).toBe(exp);
					});
				}
				if (options) {
					const { expected:exp=expected, ...opts } = options;
					test(tagLiterals`redactCodeBlocks(${input}, ${opts}) === ${exp}`, () => {
						expect(redactCodeBlocks(input, opts)).toBe(exp);
					});
				}
			});

		});
	});
});
