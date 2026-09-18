import { nth, tagLiterals } from "../../build/index.js";

describe("number", () => {
	describe("nth", () => {
		/** @type {[number, string][]} [input, output] */
		const tests = [
			[1, "1st"],
			[2, "2nd"],
			[3, "3rd"],
			[4, "4th"],
			[5, "5th"],
			[11, "11th"],
			[12, "12th"],
			[13, "13th"],
			[21, "21st"],
			[32, "32nd"],
			[43, "43rd"],
		];

		tests.forEach(([input, output]) => {
			test(tagLiterals`nth(${input}) === ${output}`, () => {
				expect(nth(input)).toBe(output);
			});
		});
	});
});
