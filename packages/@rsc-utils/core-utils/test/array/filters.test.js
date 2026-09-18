import { and, isDefined, isNullOrUndefined, or, toUnique, toUniqueDefined } from "../../build/index.js";

describe("array", () => {
	describe("filters", () => {

		const input = [2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];

		test(`toUnique`, () => {
			const expected = [2,1,null,"2",true,undefined,"1",false];
			expect(input.filter(toUnique)).toStrictEqual(expected);
		});

		test(`toUniqueDefined`, () => {
			const expected = [2,1,"2",true,"1",false];
			expect(input.filter(toUniqueDefined)).toStrictEqual(expected);
		});

		test(`and(toUnique,isDefined)`, () => {
			const expected = [2,1,"2",true,"1",false];
			expect(input.filter(and(toUnique,isDefined))).toStrictEqual(expected);
		});

		test(`or(toUnique,isDefined)`, () => {
			const expected = [2,1,null,"2",true,undefined,2,"1",1,false,true];
			expect(input.filter(or(toUnique,isDefined))).toStrictEqual(expected);
		});

		test(`or(toUnique,isNullOrUndefined)`, () => {
			const expected = [2,1,null,"2",true,null,undefined,null,"1",false];
			expect(input.filter(or(toUnique,isNullOrUndefined))).toStrictEqual(expected);
		});

	});
});
