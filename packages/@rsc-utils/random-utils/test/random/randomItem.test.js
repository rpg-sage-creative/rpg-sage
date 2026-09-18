import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { randomItem } from "../../build/index.js";

describe("random", () => {
	describe("randomItem", () => {

		const array = [1,2,"a","b",{},new Date(),new Map()];

		test(tagLiterals`randomItem(${array})`, () => {
			for (let i = 0; i < 1000; i++) {
				expect(array.includes(randomItem(array))).toBe(true);
			}
		});

		test(tagLiterals`randomItem(${[]})`, () => {
			for (let i = 0; i < 1000; i++) {
				expect(randomItem([])).toBeUndefined();
			}
		});

	});
});
