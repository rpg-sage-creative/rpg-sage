import { stringOrUndefined, tagLiterals, toLiteral } from "../../../build/index.js";

describe("string", () => {
	describe("blank", () => {
		describe("stringOrUndefined", () => {

			const blankTests = [null, undefined, "", "      ", "\n", "\t", "\n\t", "\n \t"];
			blankTests.forEach(input => {
				test(tagLiterals`stringOrUndefined(${input}) === undefined`, () => {
					expect(stringOrUndefined(input)).toBeUndefined();
				});
			});

			const nonBlankTests = ["bob", ".", "bob ", " ."];
			nonBlankTests.forEach(input => {
				test(tagLiterals`stringOrUndefined(${input}) === ${input}`, () => {
					expect(stringOrUndefined(input)).toBe(input);
				});
			});

		});
	});
});
