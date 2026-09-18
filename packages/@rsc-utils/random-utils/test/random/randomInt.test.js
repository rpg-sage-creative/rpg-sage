import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { randomInt } from "../../build/index.js";

describe("random", () => {
	describe("randomInt", () => {

		const tests = [
			// the test to see if min === max returns min as is ... which is undefined
			// while it shouldn't return that, we also shouldn't be passing in two undefined values
			{ min:undefined, max:undefined, values:[undefined] },
			// same thing as above, but for "0"
			{ min:"0", max:"0", values:["0"] },

			// Math.min *and* Math.max return NaN if either value can't become a number
			// NaN !== NaN so it ends up calling randomInt(NaN, NaN + 1) and throwing (MinNaN above)
			{ min:undefined, max:null, values:[], throws:true },
			{ min:null, max:undefined, values:[], throws:true },
			{ min:undefined, max:0, values:[], throws:true },
			{ min:0, max:undefined, values:[], throws:true },
			{ min:undefined, max:"0", values:[], throws:true },
			{ min:"bob", max:"0", values:[], throws:true },
			{ min:"0", max:"bob", values:[], throws:true },

			// our code throws this trying to convert for Math min/max
			{ min:0n, max:0, values:[0], throws:true },
			{ min:0, max:0n, values:[0], throws:true },

			{ min:1.49, max:6.49, values:[1,2,3,4,5,6], throws:true },
			{ min:1.5, max:6.5, values:[2,3,4,5,6,7], throws:true },

			{ min:0.1, max:-0.4, values:[0], throws:true },
			{ min:0, max:0, values:[0] },
			{ min:0, max:"0", values:[0] },
			{ min:"0", max:0, values:[0] },

			// true becomes 1
			{ min:"0", max:true, values:[0,1] },
			{ min:false, max:true, values:[0,1] },

			{ min:1, max:6, values:[1,2,3,4,5,6] },
			{ min:"1", max:"6", values:[1,2,3,4,5,6] },

			{ min:-10, max:10, values:[-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10] },
		];

		tests.forEach(({ min, max, values, throws }) => {
			if (!throws) {
				test(tagLiterals`randomInt(${min}, ${max}) to be in ${values}`, () => {
					for (let i = 0; i < 1000; i++) {
						expect(values.includes(randomInt(min, max))).toBe(true);
					}
				});

			}else {
				test(tagLiterals`randomInt(${min}, ${max}) to throw`, () => {
					expect(() => randomInt(min, max)).toThrow();
				});
			}
		});

	});
});
