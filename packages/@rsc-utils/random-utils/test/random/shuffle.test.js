import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { shuffle } from "../../build/index.js";

describe("random", () => {
	describe("shuffle", () => {

		const array = [1,2,"a","b",{},new Date(),new Map(),"a"];

		// empty is not shuffled
		test(tagLiterals`shuffle(${[]})`, () => {
			for (let i = 0; i < 1000; i++) {
				expect(shuffle([])).toEqual([]);
			}
		});

		// single item is not shuffled
		test(tagLiterals`shuffle(${[1]})`, () => {
			for (let i = 0; i < 1000; i++) {
				expect(shuffle([1])).toEqual([1]);
			}
		});

		test(tagLiterals`shuffle(${array})`, () => {
			for (let i = 0; i < 1000; i++) {
				const shuffled = shuffle(array);
				// same length
				expect(shuffled.length).toBe(array.length);
				// at least one item changed index
				expect(shuffled.some((item, index) => array.indexOf(item) !== index)).toBe(true);
				// each item in shuffled appears the same number of times in both shuffled and array
				shuffled.forEach(item => {
					const sFiltered = shuffled.filter(o => item === o);
					const aFiltered = array.filter(o => item === o);
					expect(sFiltered.length).toBeGreaterThan(0);
					expect(sFiltered.length).toBe(aFiltered.length);
					expect(sFiltered).toEqual(aFiltered);
				});
			}
		});

	});
});
