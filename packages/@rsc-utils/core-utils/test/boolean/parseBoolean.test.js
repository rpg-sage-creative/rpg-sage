import { parseBoolean, tagLiterals } from "../../build";

describe("boolean", () => {
	describe("parseBoolean", () => {

		const tests = [
			{ input:true, expected:true },
			{ input:1, expected:true },
			{ input:"true", expected:true },
			{ input:"1", expected:true },
			{ input:"yes", expected:true },
			{ input:"y", expected:true },

			{ input:"TRUE", expected:undefined },
			{ input:"TRUE", ignoreCase:true, expected:true },
			{ input:"YES", expected:undefined },
			{ input:"YES", ignoreCase:true, expected:true },

			{ input:false, expected:false },
			{ input:0, expected:false },
			{ input:"false", expected:false },
			{ input:"0", expected:false },
			{ input:"no", expected:false },
			{ input:"n", expected:false },

			{ input:"FALSE", expected:undefined },
			{ input:"FALSE", ignoreCase:true, expected:false },
			{ input:"NO", expected:undefined },
			{ input:"NO", ignoreCase:true, expected:false },

			{ input:null, expected:undefined },
			{ input:undefined, expected:undefined },
			{ input:{}, expected:undefined },
			{ input:"", expected:undefined },
			{ input:new Date(), expected:undefined },
			{ input:Date.now(), expected:undefined },
			{ input:"nope", expected:undefined },
			{ input:"yess", expected:undefined },
		];

		// ensure each test is valid and correct
		tests.forEach(({ input, ignoreCase, expected }) => {
			test(tagLiterals`parseBoolean(${input}, ${ignoreCase}) === ${expected}`, () => {
				expect(parseBoolean(input, ignoreCase)).toBe(expected);
			});
		});

		// ensure that the function correctly allows itself to be used in a map/filter function
		test("tests.map(t => t.input).map(parseBoolean)", () => {
			const input = tests.map(t => t.input);
			const expected = tests.map(t => t.ignoreCase ? undefined : t.expected);
			expect(input.map(parseBoolean)).toEqual(expected);
		});

	});
});