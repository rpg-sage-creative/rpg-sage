import { tagLiterals } from "../build/index.js";

describe("tagLiterals", () => {

	const now = new Date();

	const tests = [
		{ input:null, expected:`null` },

		{ input:undefined, expected:`undefined` },

		{ input:[], expected:`[]` },
		{ input:[1], expected:`[1]` },
		{ input:["a"], expected:`["a"]` },
		{ input:["a",1], expected:`["a",1]` },
		{ input:["a",[1,2]], expected:`["a",[1,2]]` },

		{ input:now, expected:`Date("${now.toISOString()}")` },

		// purposeful duplication of key "c"
		{ input:new Map([["a","B"],["c","d"],["c","D"]]), expected:`Map([["a","B"],["c","D"]])` },
		// consider ellipses for map keys ?

		{ input:/ab?[cd]+(e|f)/g, expected:`/ab?[cd]+(e|f)/g` },

		// purposeful duplication of key "c"
		{ input:new Set(["a","B","c","D","c"]), expected:`Set(["a","B","c","D"])` },

		{ input:true, expected:"true" },
		{ input:false, expected:"false" },

		{ input:12345, expected:`12345` },
		{ input:1234.5, expected:`1234.5` },
		{ input:NaN, expected:`NaN` },
		{ input:Infinity, expected:`Infinity` },
		{ input:-Infinity, expected:`-Infinity` },

		{ input:12345n, expected:`12345n` },

		{ input:"", expected:`""` },
		{ input:"not empty", expected:`"not empty"` },
		{ input:"not \" empty", expected:`"not \\" empty"` },

		{
			input: { "childObject": { "b":"C" }, "bigint": 123n },
			expected: `{"childObject":{"b":"C"},"bigint":123n}`
		},

	];

	tests.forEach(({input, expected, options}, index) => {
		test(`test index: ${index}`, () => {
			expect(tagLiterals(options)`${input}`).toBe(expected);
		});
		tests.forEach(({input:input2, expected:expected2, options:options2}, index2) => {
			test(`test indexes: [${index}, ${index2}]`, () => {
				const ellipses = [];
				ellipses.push(...options?.ellipses??[]);
				ellipses.push(...options2?.ellipses??[]);
				expect(tagLiterals({ellipses})`${input} ${input2}`).toBe(expected + " " + expected2);
			});
		});
	});
});