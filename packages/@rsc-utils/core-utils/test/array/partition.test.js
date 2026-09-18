import { partition } from "../../build/index.js";

describe("array", () => {
	// describe("partition", () => {

		test(`partition()`, () => {
			const inputValues = [2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];
			const inputFunction = val => ["boolean","number","string","object","undefined","null"].indexOf(typeof(val));
			const expected = [
				[ true, false, true ],
				[ 2, 1, 2, 1 ],
				[ '2', '1' ],
				[ null, null, null ],
				[ undefined ]
			];
			expect(partition(inputValues, inputFunction)).toStrictEqual(expected);
		});

	// });
});
