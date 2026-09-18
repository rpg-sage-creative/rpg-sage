import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { isNonNilUuid } from "../../build/index.js";
import { getTests } from "./getTests.mjs";

describe("isNonNilUuid", () => {
	const { uuid, tests } = getTests("isNonNilUuid");

	tests.forEach(({ input, isUuidResult, isNilUuidResult, isMaxUuidResult, isNonNilUuidResult, orNilUuidResult }) => {
		test(tagLiterals`isNonNilUuid(${input}) === ${isNonNilUuidResult}`, () => {
			expect(isNonNilUuid(input)).toBe(isNonNilUuidResult);
		});
	});
});
