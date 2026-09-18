import { round } from "../../build/index.js";

describe("number", () => {
	describe("round", () => {
		/** @type {[number, number, number][]} [input, decimals, output] */
		const tests = [
			[1.000999, , 1],
			[1.000999, 0, 1],
			[1.9999,   , 2],
			[1.9999,   0, 2],
			[1.000999, 4, 1.001],
			[1.000666, 5, 1.00067],
		];

		tests.forEach(([input, decimals, output]) => {
			test(`round(${input}, ${decimals}) === ${output}`, () => {
				expect(round(input, decimals)).toBe(output);
			});
		});
	});
});
