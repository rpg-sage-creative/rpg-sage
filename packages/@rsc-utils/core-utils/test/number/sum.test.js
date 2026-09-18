import { sum, tagLiterals } from "../../build/index.js";

describe("number", () => {
	describe("sum", () => {
		/** @type {[number[], number][]} [input, output] */
		const tests = [
			{ values:[1, 2, -3, -4, 3], mapper:undefined, expected:-1 },
			{ values:[1, 2, 3, 4], mapper:undefined, expected:10 },
			{ values:[1, 2, 3, 4], mapper:n => n * 2, expected:20 },
			{ values:[1, 2, 3, 4].map(n => ({val:n})), mapper:o => o.val, expected:10 },
		];

		tests.forEach(({ values, mapper, expected }) => {
			test(tagLiterals`sum(${values}, ${mapper}) === ${expected}`, () => {
				expect(sum(values, mapper)).toBe(expected);
			});
		});
	});
});
