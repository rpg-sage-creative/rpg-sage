import { filterAndMap, toUnique } from "../../build/index.js";

describe("array", () => {
	// describe("filterAndMap", () => {
		test(`filterAndMap()`, () => {
			const input = [2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];
			const expected = [
				'2-2',
				'1-1',
				'null-null',
				'2-2',
				'true-true',
				'undefined-undefined',
				'1-1',
				'false-false'
			];
			const output = filterAndMap(input, toUnique, val => `${val}-${val}`);
			expect(output).toStrictEqual(expected);
		});
	// });
});
