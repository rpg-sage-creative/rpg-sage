import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { parseUuid, generateUuid } from "../../build/index.js";

describe("uuid", () => {
	describe("parseUuid", () => {

		const uuid = generateUuid();

		/** [ [input, output], ... ] */
		const tests = [
			{ input:uuid, expected:uuid },
			{ input:`{"id":"${uuid}"}`, expected:uuid },
			{ input:"1234567890123456", expected:undefined },
			{ input:"control", expected:undefined },
		];

		tests.forEach(({ input, expected }) => {
			test(tagLiterals`parseUuid(${input}) === ${expected}`, () => {
				expect(parseUuid(input)).toBe(expected);
			});
		})
	});
});
