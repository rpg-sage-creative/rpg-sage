import { tagLiterals, toLiteral } from "../build/index.js";

describe("toLiteral", () => {

	const now = new Date();

	const tests = [
		{ input:null, expected:`null` },

		{ input:undefined, expected:`undefined` },

		{ input:[], expected:`[]` },
		{ input:[1], expected:`[1]` },
		{ input:["a"], expected:`["a"]` },
		{ input:["a",1], expected:`["a",1]` },
		{ input:["a",[1,2]], expected:`["a",[1,2]]` },
		{ input:["a",[1,2]], expected:`["a",[…]]`, options:{ellipses:["1"]} },

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
		{
			input: { "childObject": { "b":"C" }, "bigint": 123n },
			expected: `{"childObject":{…},"bigint":123n}`,
			options: { ellipses:["childObject"] }
		},
		{
			input: { "childObject": { "b":{"c":"D"} }, "bigint": 123n },
			expected: `{"childObject":{"b":{…}},"bigint":123n}`,
			options: { ellipses:["childObject.b"] }
		},
		{
			input: { "childObject": { "b":{"c":"D"} }, "bigint": 123n, "other":{"b":"B"} },
			expected: `{"childObject":{"b":{…}},"bigint":123n,"other":{"b":"B"}}`,
			options: { ellipses:["*.b"] }
		},
		{
			input: { "childObject": { "b":{"c":"D"} }, "bigint": 123n, "other":{"b":{"e":"E"}} },
			expected: `{"childObject":{"b":{…}},"bigint":123n,"other":{"b":{…}}}`,
			options: { ellipses:["*.b"] }
		},

	];

	tests.forEach(({ input, expected, options }) => {
		test(tagLiterals`toLiteral(${input}, ${options}) === ` + expected, () => {
			expect(toLiteral(input, options)).toBe(expected);
		});
	});

});