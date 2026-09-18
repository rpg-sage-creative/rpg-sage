import { trimOrUndefined, toLiteral, tagLiterals } from "../../../build/index.js";

describe("string", () => {
	describe("blank", () => {
		describe("trimOrUndefined", () => {

			const blankTests = [null, undefined, "", "      ", "\n", "\t", "\n\t", "\n \t"];
			blankTests.forEach(input => {
				test(tagLiterals`trimOrUndefined(${input}) === undefined`, () => {
					expect(trimOrUndefined(input)).toBeUndefined();
				});
			});

			const nonBlankTests = ["bob", ".", " bob ", " . "];
			nonBlankTests.forEach(input => {
				test(tagLiterals`trimOrUndefined(${input}) === ${input.trim()}`, () => {
					expect(trimOrUndefined(input)).toBe(input.trim());
				});
			});

		});
	});
});
