import { tagLiterals } from "@rsc-utils/core-utils";
import { unwrapUrl } from "../../build/index.js";

describe("url", () => {
	describe("unwrapUrl", () => {

		const unwrappedUrl = "https://google.com";
		const wrappedUrl = "<https://google.com>";
		const nonUrl = "hello there";
		const multipleUrlsBefore = [nonUrl, wrappedUrl, nonUrl, unwrappedUrl, nonUrl, unwrappedUrl].join(" ");
		const multipleUrlsAfter = [nonUrl, wrappedUrl, nonUrl, wrappedUrl, nonUrl, wrappedUrl].join(" ");

		const tests = [
			{ input:null, expected:null },
		];
		tests.forEach(({ input, expected }) => {
			test(tagLiterals`unwrapUrl(${input}) === ${expected}`, () => {
				expect(unwrapUrl(input)).toBe(expected);
			});
		});

	});
});