import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { isRgbColorString } from "../build/index.js";

describe("color", () => {
	describe("isRgbColorString", () => {
		// [ [input, output], ... ]
		const tests = [
			// hex
			["#fff", false],
			["#ffffff", false],
			// missing )
			["rgb(128,255,0", false],
			["rgb(128,255,0.0,2", false],
			// reversed rgb and rgba
			["rgba(128,255,0)", false],
			["rgb(128,255,0,0.5)", false],
			// invalid g
			["rgb(128,256,0)", false],
			// invalid alpha
			["rgb(128,255,0,2)", false],

			["rgb(128,255,0)", true],
			["rgba(128,255,0,0.5)", true],
		];

		tests.forEach(([value, expected]) => {
			test(tagLiterals`isRgbColorString(${value}) === ${expected}`, () => {
				expect(isRgbColorString(value)).toBe(expected);
			});
		});

	});
});
