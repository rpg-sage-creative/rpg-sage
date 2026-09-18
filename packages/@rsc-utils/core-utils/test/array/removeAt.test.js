import { removeAt } from "../../build/index.js";

describe("array", () => {
	// describe("removeAt", () => {

		test(`removeAt`, () => {
			const input = [2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];

			// remove and return value at index 1
			const expectedRemoved1 = 1;
			const expectedRemaining1 = [ 2, null, '2', true, null, undefined, 2, null, '1', 1, false, true];
			const removed1 = removeAt(input, 1);
			expect(removed1).toBe(expectedRemoved1);
			expect(input).toStrictEqual(expectedRemaining1);

			// remove and return value at index 1
			const expectedRemoved2 = [ null, '2' ];
			const expectedRemaining2 = [ 2, true, null, undefined, 2, null, '1', 1, false, true];
			const removed2 = removeAt(input, [1,2]);
			expect(removed2).toStrictEqual(expectedRemoved2);
			expect(input).toStrictEqual(expectedRemaining2);
		});

	// });
});
