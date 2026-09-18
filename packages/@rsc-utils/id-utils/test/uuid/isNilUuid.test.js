import { tagLiterals } from "@rsc-utils/template-literal-utils";
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
