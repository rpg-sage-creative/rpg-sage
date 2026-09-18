import { isQuoted, tagLiterals } from "../../../build/index.js";
import { getTests } from "./data.js";

describe("string", () => {
	describe("quotes", () => {
		describe("isQuoted", () => {

			const tests = getTests("isQuoted");
			tests.forEach(args => {
				const quoted = args.quoted;
				const expected = args.isQuoted ?? true;
				test(tagLiterals`isQuoted(${quoted}) === ${expected}`, () => {
					expect(isQuoted(quoted)).toBe(expected);
				});
			});

		});
	});
});