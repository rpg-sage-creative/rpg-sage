import { isDefined } from "@rsc-utils/type-utils";
import { remove } from "../build/index.js";

describe("remove", () => {
	// describe("remove", () => {

		test(`remove`, () => {
			const input = [2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];
			const expectedRemoved = [2,1,"2",true,2,"1",1,false,true];
			const expectedRemaining = [ null, null, undefined, null ];
			const removed = remove(input, isDefined);
			expect(removed).toStrictEqual(expectedRemoved);
			expect(input).toStrictEqual(expectedRemaining);
		});

	// });
});
