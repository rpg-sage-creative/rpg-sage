import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { getEnumKeys, getEnumValues, parseEnum } from "../build/index.js";

describe("enums", () => {

	let DayNight;
	(function (DayNight) {
		DayNight[DayNight["Day"] = 0] = "Day";
		DayNight[DayNight["Night"] = 1] = "Night";
	})(DayNight || (DayNight = {}));

	describe("getEnumValues", () => {
		test(tagLiterals`getEnumValues(${DayNight}) === [0,1]`, () => {
			expect(getEnumValues(DayNight)).toEqual([0,1]);
		});
	});

	describe("getEnumKeys", () => {
		test(tagLiterals`getEnumKeys(${DayNight}) === ["Day","Night"]`, () => {
			expect(getEnumKeys(DayNight)).toEqual(["Day","Night"]);
		});
	});

	describe("parseEnum", () => {
		/** [ [input, output], ... ] */
		const tests = [
			[0, 0],
			["day", 0],
			["Day", 0],
			[1, 1],
			["night", 1],
			["Night", 1],
			["1", undefined],
			[2, undefined],
			["daynight", undefined],
			[undefined, undefined],
			[null, undefined],
		];
		tests.forEach(([input, output]) => {
			test(tagLiterals`parseEnum(${DayNight}, ${input}) === ${output}`, () => {
				expect(parseEnum(DayNight, input)).toBe(output);
			});
		});
	});

});
