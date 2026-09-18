import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { isHexColorString } from "../build/index.js";

describe("color", () => {
	describe("isHexColorString", () => {
		// [ [input, arg, output], ... ]
		const tests = [
			["rgb(128,255,0)", undefined, false],
			["rgba(128,255,0,0.5)", undefined, false],

			["#12", undefined, false],
			["#12345", undefined, false],
			["#1234567", undefined, false],
			["#123456789", undefined, false],

			["#000", undefined, true],
			["#1111", undefined, true],
			["#aaaaaa", undefined, true],
			["#ffffffff", undefined, true],

			["#80ff00", undefined, true],
			["#80ff00", true, false],
			["#80ff0080", true, true],
			["#80ff00", false, true],
			["#80ff0080", false, false],
			["#80ff0080", undefined, true],
		];

		tests.forEach(([value, arg, expected]) => {
			test(tagLiterals`isHexColorString(${value}, ${arg}) === ${expected}`, () => {
				expect(isHexColorString(value, arg)).toBe(expected);
			});
		});

	});
});
