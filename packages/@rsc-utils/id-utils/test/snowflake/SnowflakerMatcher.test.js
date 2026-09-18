import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { generateSnowflake, SnowflakeMatcher } from "../../build/index.js";

describe("SnowflakeMatcher", () => {

	const snowflake = generateSnowflake();
	const matcher = new SnowflakeMatcher(snowflake);

	const tests = [
		{ input:snowflake, expected:true },
		{ input:"control", expected:false },
		{ input:matcher, expected:true },
		{ input:null, expected:false },
	];

	tests.forEach(({ input, expected }) => {
		test(tagLiterals`matcher.matches(${input}) === ${expected}`, () => {
			expect(matcher.matches(input)).toBe(expected);
		});
	});
});
