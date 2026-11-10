import { describe, expect, test } from "vitest";
import { areEqual, stringifyJson } from "../build/index.js";

type TestData = {
	a: unknown;
	b: unknown;
	equal: boolean;
	options?: { strict?:boolean; ignore?:string[]; }
};

describe("areEqual", () => {

	const tests: TestData[] = [
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

		// primitives
		{ a:1, b:1, equal:true },
		{ a:"Apple", b:"apple", equal:false },
		{ a:null, b:undefined, equal:false },
		{ a:undefined, b:undefined, equal:true },

		// stringifyJson turns NaN into null and -0 into 0
		{ a:NaN, b:NaN, equal:true },
		{ a:0, b:-0, equal:true },

		// dates compare by their stringified value
		{ a:new Date(100), b:new Date(100), equal:true },
		{ a:new Date(100), b:new Date(200), equal:false },

		// bigints compare by their stringified value
		{ a:1n, b:1n, equal:true },
		{ a:1n, b:"1", equal:false },

		// arrays are order sensitive
		{ a:[1, 2], b:[1, 2], equal:true },
		{ a:[1, 2], b:[2, 1], equal:false },

		// ignore keyPaths can go any number of levels deep
		{ a:{ x:{ y:{ z:1, w:2 } } }, b:{ x:{ y:{ z:9, w:2 } } }, options:{ ignore:["x.y.z"] }, equal:true },
		{ a:{ x:{ y:{ z:1, w:2 } } }, b:{ x:{ y:{ z:9, w:2 } } }, options:{ ignore:["x.y.q"] }, equal:false },

	];

	for (const { a, b, options, equal } of tests) {
		test(`areEqual(${stringifyJson(a)}, ${stringifyJson(b)}, ${stringifyJson(options)}) === ${equal}`, () => {
			expect(areEqual(a, b, options as undefined)).toBe(equal);
		});
	}

});