import { toLiteral } from "@rsc-utils/core-utils";
import { toRoleMention } from "../../build/index.js";

describe("mention", () => {
	describe("toRoleMention", () => {
		const tests = [
			{ input:"1234567890123456", expected:`<@&1234567890123456>` },
		];
		tests.forEach(({ input, expected }) => {
			test(`toRoleMention(${toLiteral(input)}) === ${toLiteral(expected)}`, () => {
				expect(toRoleMention(input)).toBe(expected);
			});
		});

	});
});