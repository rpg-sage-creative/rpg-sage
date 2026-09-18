import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { parseSnowflake, generateSnowflake } from "../../build/index.js";

describe("parseSnowflake", () => {

	const short = "123456789012345";
	const min = "1234567890123456";
	const id = generateSnowflake();
	const channelId = `<#${id}>`;
	const roleId = `<@&${id}>`;
	const userId = `<@${id}>`;
	const control = "control";

	const tests = [
		{ input:short, expected:undefined },
		{ input:min, expected:min },
		{ input:id, expected:id },
		{ input:channelId, expected:id },
		{ input:roleId, expected:id },
		{ input:userId, expected:id },
		{ input:control, expected:undefined },
	];

	tests.forEach(({ input, expected }) => {
		test(tagLiterals`parseSnowflake(${input}) === ${expected}`, () => {
			expect(parseSnowflake(input)).toBe(expected);
		});
	});
});
