import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { NIL_SNOWFLAKE, orNilSnowflake, generateSnowflake } from "../../build/index.js";
import { getTests } from "./data.js";

describe("orNilSnowflake", () => {
	const tests = getTests(generateSnowflake(), NIL_SNOWFLAKE);
	tests.forEach(({ input, orNilSnowflakeResult }) => {
		test(tagLiterals`orNilSnowflake(${input}) === ${orNilSnowflakeResult}`, () => {
			expect(orNilSnowflake(input)).toBe(orNilSnowflakeResult);
		});
	});
});
