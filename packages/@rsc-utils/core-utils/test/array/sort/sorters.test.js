import { or, sortAsPrimitive, sortPrimitive } from "../../../build/index.js";

describe("array", () => {
	describe("sorters", () => {
		const _input = [ 2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];

		test(`sortAsPrimitive("string")`, () => {
			const input = _input.slice();
			const expected = [ 1,"1",1,2,"2",2,false,true,true,null,null,null,undefined];
			expect(input).not.toStrictEqual(expected);
			input.sort(sortAsPrimitive("string"));
			expect(input).toStrictEqual(expected);
		});

		test(`or((a,b)=>sortPrimitive(a.level,b.level),(a,b)=>sortPrimitive(a.name,b.name))`, () => {
			const input = [{level:0,name:"Zero"},{level:1,name:"Zero"},{level:0,name:"zero"},{level:0,name:"one"},{level:1,name:"zero"},{level:1,name:"one"}];
			const expected = [{level:0,name:"one"},{level:0,name:"Zero"},{level:0,name:"zero"},{level:1,name:"one"},{level:1,name:"Zero"},{level:1,name:"zero"}];
			expect(input).not.toStrictEqual(expected);
			input.sort(or((a, b) => sortPrimitive(a.level, b.level),(a, b) => sortPrimitive(a.name, b.name)));
			expect(input).toStrictEqual(expected);
		});
	});
});
