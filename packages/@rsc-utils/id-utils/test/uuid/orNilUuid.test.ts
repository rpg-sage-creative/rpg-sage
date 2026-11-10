import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { orNilUuid } from "../../build/index.js";
import { getTests } from "./getTests.mjs";

describe("orNilUuid", () => {
	const { uuid, tests } = getTests("orNilUuid");

	tests.forEach(({ input, isUuidResult, isNilUuidResult, isMaxUuidResult, isNonNilUuidResult, orNilUuidResult }) => {
		test(tagLiterals`orNilUuid(${input}) === ${orNilUuidResult}`, () => {
			expect(orNilUuid(input)).toBe(orNilUuidResult);
		});
	});
});
