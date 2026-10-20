import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { isNotBlank } from "../../build/index.js";

describe("blank", () => {
	describe("isNotBlank", () => {

		const blankTests = [null, undefined, "", "      ", "\n", "\t", "\n\t", "\n \t"];
		blankTests.forEach(input => {
			test(tagLiterals`isNotBlank(${input}) === false`, () => {
				expect(isNotBlank(input)).toBe(false);
			});
		});

		const nonBlankTests = ["bob", "."];
		nonBlankTests.forEach(input => {
			test(tagLiterals`isNotBlank(${input}) === true`, () => {
				expect(isNotBlank(input)).toBe(true);
			});
		});

	});
});