import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { type RedactCodeBlocksOptions, redactContent, type RedactKeyValuePairsOptions, type RedactMdLinksOptions, type RedactOptions } from "../../build/index.js";
import { getTests } from "./data.mjs";

type RedactContentOptions = RedactOptions & {
	codeBlocks?: boolean | RedactCodeBlocksOptions;
	keyValuePairs?: boolean | RedactKeyValuePairsOptions;
	mdLinks?: boolean | RedactMdLinksOptions;
};

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
				const opts: RedactContentOptions = { };
				let exp = expected;

				if ("contentChar" in options) {
					exp = options.expected;
					opts.codeBlocks = options as RedactCodeBlocksOptions;
				}

				if ("keyChar" in options) {
					exp = options.expected;
					opts.keyValuePairs = options as RedactKeyValuePairsOptions;
				}

				if ("labelChar" in options) {
					exp = options.expected;
					opts.mdLinks = options as RedactMdLinksOptions;
				}

				test(tagLiterals`redactContent(${input}, ${opts}) === ${exp}`, () => {
					expect(redactContent(input, opts)).toBe(exp);
				});
			}

		});

	});
});
