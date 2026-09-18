import { without } from "../../build/index.js";

describe("array", () => {
	// describe("without", () => {

		test("without", () => {
			const input = [2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];
			const expected = [ 2, 1, '2', true, undefined, 2, '1', 1, false, true ];
			const output = without(input, null);
			expect(output).toStrictEqual(expected);
		});

	// });
});
