import { tagLiterals } from "@rsc-utils/template-literal-utils";
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
