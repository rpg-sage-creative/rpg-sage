import { tagLiterals } from "@rsc-utils/core-utils";
import { parseId } from "../../build/index.js";

describe("parse", () => {
	describe("parseId", () => {
		const id = "1234567890123456";
		const channelId = `<#${id}>`;
		const roleId = `<@&${id}>`;
		const userId = `<@${id}>`;
		const userId2 = `<@!${id}>`;
		const control = "control";

		const channelUrl = "https://discord.com/channels/480488957889609733/1182487240534937610";
		const messageUrl = "https://discord.com/channels/480488957889609733/1182487240534937610/1192628934014140476";

		const tests = [
			{ input:channelId, type:"channel", expected:id },
			{ input:roleId, type:"channel", expected:undefined },
			{ input:userId, type:"channel", expected:undefined },
			{ input:userId2, type:"channel", expected:undefined },
			{ input:control, type:"channel", expected:undefined },

			{ input:channelId, type:"role", expected:undefined },
			{ input:roleId, type:"role", expected:id },
			{ input:userId, type:"role", expected:undefined },
			{ input:userId2, type:"role", expected:undefined },
			{ input:control, type:"role", expected:undefined },

			{ input:channelId, type:"user", expected:undefined },
			{ input:roleId, type:"user", expected:undefined },
			{ input:userId, type:"user", expected:id },
			{ input:userId2, type:"user", expected:id },
			{ input:control, type:"user", expected:undefined },

			{ input:channelUrl, type:"channel", expected:"1182487240534937610" },
			{ input:channelUrl, type:"message", expected:undefined },

			{ input:messageUrl, type:"channel", expected:undefined },
			{ input:messageUrl, type:"message", expected:"1192628934014140476" },
		];
		tests.forEach(({ input, type, expected }) => {
			test(tagLiterals`parseId(${input}, $(type}) === ${expected}`, () => {
				expected
				? expect(parseId(input, type)).toBe(expected)
				: expect(parseId(input, type)).toBeUndefined();
			});
			const spacedInput = ` ${input} `;
			test(tagLiterals`parseId(${spacedInput}, ${type}) === ${expected}`, () => {
				expected
				? expect(parseId(spacedInput, type)).toBe(expected)
				: expect(parseId(spacedInput, type)).toBeUndefined();
			});
		});

	});
});