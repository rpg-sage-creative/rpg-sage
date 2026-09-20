import { tagLiterals } from "@rsc-utils/type-utils";
import { isUuid } from "../../build/index.js";
import { getTests } from "./getTests.mjs";

describe("isUuid", () => {
	const { uuid, tests } = getTests("isUuid");

	tests.forEach(({ input, isUuidResult, isNilUuidResult, isMaxUuidResult, isNonNilUuidResult, orNilUuidResult }) => {
		test(tagLiterals`isUuid(${input}) === ${isUuidResult}`, () => {
			expect(isUuid(input)).toBe(isUuidResult);
		});
	});
});
