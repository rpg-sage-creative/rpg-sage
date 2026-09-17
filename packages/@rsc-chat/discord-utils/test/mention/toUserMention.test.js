import { toLiteral } from "@rsc-utils/core-utils";
import { toUserMention } from "../../build/index.js";

describe("mention", () => {
	describe("toUserMention", () => {
		const tests = [
			{ input:"1234567890123456", expected:`<@1234567890123456>` },
		];
		tests.forEach(({ input, expected }) => {
			test(`toUserMention(${toLiteral(input)}) === ${toLiteral(expected)}`, () => {
				expect(toUserMention(input)).toBe(expected);
			});
		});

	});
});