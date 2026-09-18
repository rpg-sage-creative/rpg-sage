import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { NIL_SNOWFLAKE, isNilSnowflake, generateSnowflake } from "../../build/index.js";
import { getTests } from "./data.js";

describe("isNilSnowflake", () => {
	const tests = getTests(generateSnowflake(), NIL_SNOWFLAKE);
	tests.forEach(({ input, isNilSnowflakeResult }) => {
		test(tagLiterals`isNilSnowflake(${input}) === ${isNilSnowflakeResult}`, () => {
			expect(isNilSnowflake(input)).toBe(isNilSnowflakeResult);
		});
	});
});
