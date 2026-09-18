import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { isMaxUuid } from "../../build/index.js";
import { getTests } from "./getTests.mjs";

describe("isMaxUuid", () => {
	const { uuid, tests } = getTests("isMaxUuid");

	tests.forEach(({ input, isUuidResult, isNilUuidResult, isMaxUuidResult, isNonNilUuidResult, orNilUuidResult }) => {
		test(tagLiterals`isMaxUuid(${input}) === ${isMaxUuidResult}`, () => {
			expect(isMaxUuid(input)).toBe(isMaxUuidResult);
		});
	});
});
