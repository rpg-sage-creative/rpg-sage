import { numberOrUndefined, tagLiterals } from "../../build/index.js";

describe("number", () => {
	describe("numberOrUndefined", () => {

		const tests = [
			// invalid
			{ input:null, expected:undefined },
			{ input:undefined, expected:undefined },
			{ input:NaN, expected:undefined },
			{ input:Infinity, expected:undefined },

			// numbers
			{ input:-1, expected:-1 },
			{ input:-0.000001, expected:-0.000001 },
			{ input:0, expected:0 },
			{ input:0.000001, expected:0.000001 },
			{ input:1, expected:1 },

			// invalid strings
			{ input:"null", expected:undefined },
			{ input:"undefined", expected:undefined },
			{ input:"NaN", expected:undefined },
			{ input:"Infinity", expected:undefined },

			// valid strings
			{ input:"-1", expected:-1 },
			{ input:"-0.000001", expected:-0.000001 },
			{ input:"0", expected:0 },
			{ input:"0.000001", expected:0.000001 },
			{ input:"1", expected:1 },
			{ input:"+1", expected:1 },

			// non-anchored strings
			{ input:" +1 ", expected:undefined },
			{ input:" 1 ", expected:undefined },
		];

		tests.forEach(({ input, expected }) => {
			test(tagLiterals`numberOrUndefined(${input}) === ${expected}`, () => {
				expect(numberOrUndefined(input)).toBe(expected);
			});
		});

	});
});