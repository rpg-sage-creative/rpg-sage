import { isWrapped, tagLiterals } from "../../../build/index.js";
import { getTests } from "./data.js";

describe("string", () => {
	describe("wrap", () => {
		describe("isWrapped", () => {

			const tests = getTests();
			tests.forEach(({ unwrapped, chars, wrapped }) => {
				test(tagLiterals`isWrapped(${wrapped}, ${chars}) === true`, () => {
					expect(isWrapped(wrapped, chars)).toBe(true);
				});
				test(tagLiterals`isWrapped(${chars}, ${chars}) === false`, () => {
					expect(isWrapped(chars, chars)).toBe(false);
				});
				test(tagLiterals`isWrapped(${unwrapped}, ${chars}) === false`, () => {
					expect(isWrapped(unwrapped, chars)).toBe(false);
				});
			});

		});
	});
});
