import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { NIL_SNOWFLAKE, isSnowflake, generateSnowflake } from "../../build/index.js";
import { getTests } from "./data.js";

describe("isSnowflake", () => {
	const tests = getTests(generateSnowflake(), NIL_SNOWFLAKE);
	tests.forEach(({ input, isSnowflakeResult }) => {
		test(tagLiterals`isSnowflake(${input}) === ${isSnowflakeResult}`, () => {
			expect(isSnowflake(input)).toBe(isSnowflakeResult);
		});
	});
});
