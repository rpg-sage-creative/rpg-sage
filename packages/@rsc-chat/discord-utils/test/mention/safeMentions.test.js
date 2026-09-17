import { toLiteral } from "@rsc-utils/core-utils";
import { safeMentions } from "../../build/index.js";

describe("mention", () => {
	describe("safeMentions", () => {
		const tests = [
			{ input:"one @here", expected:"one @\u200Bhere" },
			{ input:"two @everyone", expected:"two @\u200Beveryone" },
		];
		tests.forEach(({ input, expected }) => {
			test(`safeMentions(${toLiteral(input)}) === ${toLiteral(expected)}`, () => {
				expect(safeMentions(input)).toBe(expected);
			});
		});

	});
});