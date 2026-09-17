import { toLiteral } from "@rsc-utils/core-utils";
import { toChannelMention } from "../../build/index.js";

describe("mention", () => {
	describe("toChannelMention", () => {
		const tests = [
			{ input:"1234567890123456", expected:`<#1234567890123456>` },
		];
		tests.forEach(({ input, expected }) => {
			test(`toChannelMention(${toLiteral(input)}) === ${toLiteral(expected)}`, () => {
				expect(toChannelMention(input)).toBe(expected);
			});
		});

	});
});