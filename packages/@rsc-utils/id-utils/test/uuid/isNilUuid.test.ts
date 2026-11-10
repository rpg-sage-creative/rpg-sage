import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { isNilUuid } from "../../build/index.js";
import { getTests } from "./getTests.mjs";

describe("isNilUuid", () => {
	const { uuid, tests } = getTests("isNilUuid");

	tests.forEach(({ input, isUuidResult, isNilUuidResult, isMaxUuidResult, isNonNilUuidResult, orNilUuidResult }) => {
		test(tagLiterals`isNilUuid(${input}) === ${isNilUuidResult}`, () => {
			expect(isNilUuid(input)).toBe(isNilUuidResult);
		});
	});
});
