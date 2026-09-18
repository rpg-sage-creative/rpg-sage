import { isBlank, tagLiterals } from "../../../build/index.js";

describe("string", () => {
	describe("blank", () => {
		describe("isBlank", () => {

			const blankTests = [null, undefined, "", "      ", "\n", "\t", "\n\t", "\n \t"];
			blankTests.forEach(input => {
				test(tagLiterals`isBlank(${input}) === true`, () => {
					expect(isBlank(input)).toBe(true);
				});
			});

			const nonBlankTests = ["bob", "."];
			nonBlankTests.forEach(input => {
				test(tagLiterals`isBlank(${input}) === false`, () => {
					expect(isBlank(input)).toBe(false);
				});
			});

		});
	});
});