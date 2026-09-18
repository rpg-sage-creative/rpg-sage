import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { areEqual } from "../build/index.js";

describe("areEqual", () => {

	const tests = [
		{ a: {}, b: {}, equal:true },

		// stringify removes "empty" as a key due to undefined
		{ a: { empty:undefined }, b: {}, equal:true },

		// stringify keeps "empty" if null
		{ a: { empty:null }, b: {}, equal:false },

		{ a: { one:"one" }, b: {}, equal:false },
		{ a: {}, b: { one:"one" }, equal:false },
		{ a: { one:"one" }, b: { one:"one" }, equal:true },

		{ a: { one:"one", two:2 }, b: { two:2, one:"one" }, equal:true },
		{ a: { one:"one", two:2 }, b: { two:2, one:"one" }, options:{ strict:true }, equal:false },

		{ a: { two:2, one:"one" }, b: { one:"one", two:2 }, equal:true },
		{ a: { two:2, one:"one" }, b: { one:"one", two:2 }, options:{ strict:true }, equal:false },

		{ a: { one:"one", two:"2" }, b: { two:2, one:"one" }, equal:false },
		{ a: { one:"one", two:"2" }, b: { two:2, one:"one" }, options:{ ignore:["two"] }, equal:true },

		{ a: { three:"3", one:1, two:2 }, b: { two:2, one:1, three:"3" }, equal:true },
		{ a: { three:"3", one:1, two:2 }, b: { two:2, one:1, three:3 }, options:{ ignore:["three"] }, equal:true },
		{ a: { three:{"3":3,"3_4":3.4}, one:1, two:2 }, b: { two:2, one:1, three:{"3":3,"3_4":"3.4"} }, options:{ ignore:["three"] }, equal:true },
		{ a: { three:{"3":3,"3_4":3.4}, one:1, two:2 }, b: { two:2, one:1, three:{"3":3,"3_4":"3.4"} }, options:{ ignore:["three.3_4"] }, equal:true },
		{ a: { three:{"3":3,"3_4":3.4}, one:1, two:2 }, b: { two:2, one:1, three:{"3":"3","3_4":"3.4"} }, options:{ ignore:["three.3_4"] }, equal:false },
	];

	for (const { a, b, options, equal } of tests) {
		test(tagLiterals`areEqual(${a}, ${b}, ${options}) === ${equal}`, () => {
			expect(areEqual(a, b, options)).toBe(equal);
		});
	}

});