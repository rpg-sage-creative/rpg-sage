import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { isVisibleColor } from "../build/index.js";

describe("color", () => {
	describe("isVisibleColor", () => {
		// [ [input, output], ... ]
		const tests = [
			["#fff", true],
			["#ffff", true],
			["#fff0", false],

			["#aabbccdd", true],
			["#aabbcc", true],
			["#aabbcc00", false],

			["rgb(128,255,0)", true],
			["rgba(128,255,0,0.5)", true],
			["rgba(128,255,0,0)", false],
		];

		tests.forEach(([value, expected]) => {
			test(tagLiterals`isVisibleColor(${value}) === ${expected}`, () => {
				expect(isVisibleColor(value)).toBe(expected);
			});
		});

	});
});
