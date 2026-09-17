import { tagLiterals } from "@rsc-utils/core-utils";
import { wrapUrls } from "../../build/index.js";

describe("url", () => {
	describe("wrapUrls", () => {

		const unwrappedUrl = "https://google.com";
		const wrappedUrl = "<https://google.com>";
		const nonUrl = "hello there";
		const multipleUrlsBefore = [nonUrl, wrappedUrl, nonUrl, unwrappedUrl, nonUrl, unwrappedUrl].join(" ");
		const multipleUrlsAfter = [nonUrl, wrappedUrl, nonUrl, wrappedUrl, nonUrl, wrappedUrl].join(" ");
		const mashed = nonUrl + unwrappedUrl + unwrappedUrl + nonUrl;
		const mashedBefore = nonUrl + " " + unwrappedUrl + unwrappedUrl + " " + nonUrl;
		const mashedAfter = nonUrl + " " + wrappedUrl.slice(0, -1) + "https>" + unwrappedUrl.slice(5) + " " + nonUrl;

		const tests = [
			{ input:unwrappedUrl, expected:wrappedUrl },
			{ input:unwrappedUrl+" ", expected:wrappedUrl+" " },
			{ input:unwrappedUrl+" ", expected:wrappedUrl+" " },
			{ input:unwrappedUrl, expected:wrappedUrl },
			{ input:wrappedUrl, expected:wrappedUrl },
			{ input:nonUrl, expected:nonUrl },
			{ input:multipleUrlsBefore, expected:multipleUrlsAfter },
			{ input:mashed, expected:mashed },
			{ input:mashedBefore, expected:mashedAfter },
		];
		tests.forEach(({ input, expected }) => {
			test(tagLiterals`wrapUrls(${input}) === ${expected}`, () => {
				expect(wrapUrls(input)).toBe(expected);
			});
		});

	});
});