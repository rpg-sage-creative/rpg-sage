import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { generateUuid, UuidMatcher } from "../../build/index.js";

describe("uuid", () => {
	describe("UuidMatcher", () => {

		const uuid = generateUuid();
		const matcher = new UuidMatcher(uuid);

		/** [ [input, output], ... ] */
		const tests = [
			{ input:uuid, expected:true },
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

});
