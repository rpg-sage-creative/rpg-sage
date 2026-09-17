import { tagLiterals } from "@rsc-utils/core-utils";
import { wrapUrl } from "../../build/index.js";

describe("url", () => {
	describe("wrapUrl", () => {

		const unwrappedUrl = "https://google.com";
		const wrappedUrl = "<https://google.com>";
		const nonUrl = "hello there";

		const tests = [
			{ input:unwrappedUrl, expected:wrappedUrl },
			{ input:unwrappedUrl+" ", expected:unwrappedUrl+" " },
			{ input:wrappedUrl, expected:wrappedUrl },
			{ input:wrappedUrl+" ", expected:wrappedUrl+" " },
			{ input:nonUrl, expected:nonUrl },
			{ input:null, expected:null },
			{ input:undefined, expected:undefined },
		];
		tests.forEach(({ input, expected }) => {
			test(tagLiterals`wrapUrl(${input}) === ${expected}`, () => {
				expect(wrapUrl(input)).toBe(expected);
			});
		});

	});
});