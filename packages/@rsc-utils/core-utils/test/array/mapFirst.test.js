import { isDefined, mapFirst, tagLiterals } from "../../build/index.js";

describe("array", () => {
	describe("mapFirst", () => {
		const values = [2,1,null,true];
		const tests = [
			{ callbackfn:(o,i,a) => o===2?o:undefined, expected:2 },
			{ callbackfn:(o,i,a) => o===i?o:undefined, expected:1 },
			// is value boolean
			{ callbackfn:(o,i,a) => typeof(o)==="boolean"?o:undefined, expected:true },
			// is last value in array
			{ callbackfn:(o,i,a) => i===a.length-1?o:undefined, expected:true },
			// the mapper returns true, which is defined, so we get the true instead of the 2
			{ callbackfn:(o,i,a) => o===2, expected:true },
			// even though we are returning null at index 2, null isn't defined so we wind up with undefined
			{ callbackfn:(o,i,a) => !o?o:undefined, expected:undefined },
		];
		tests.forEach(({ callbackfn, expected }) => {
			test(tagLiterals`mapFirst(${values}, ${callbackfn})`, () => {
				const output = mapFirst(values, callbackfn);
				expect(output).toBe(expected);
				// as this function is man
				const hardWay = values.map(callbackfn).find(isDefined);
				expect(output).toBe(hardWay);
			});
		});
	});
});
