import { tagLiterals } from "@rsc-utils/type-utils";
import { cleanWhitespace } from "../../build/index.js";

describe("string", () => {
	describe("whitespace", () => {
		describe("cleanWhitespace", () => {

			const tests = [
				{ input:null, options:undefined, expected:null },
				{ input:undefined, options:undefined, expected:undefined },
				{ input:"", options:undefined, expected:"" },
				{ input:"mud", options:undefined, expected:"mud" },

				{ input:" m u d ", options:undefined, expected:"m u d" },
				{ input:" m  u  d ", options:undefined, expected:"m u d" },
				{ input:" m  u   d ", options:{replacement:"\t"}, expected:"m\tu\td" },
				{ input:" m  u   d ", options:{replacement:""}, expected:"mud" },

				{ input:" m\nu\rd ", options:undefined, expected:"m u d" },
				{ input:" m\nu\rd ", options:{horizontalOnly:true}, expected:"m\nu\rd" },
				{ input:" m\nu\rd ", options:{replacement:"\t"}, expected:"m\tu\td" },

				{ input:" m\tu\nd ", options:undefined, expected:"m u d" },
				{ input:" m\tu\nd ", options:{horizontalOnly:true}, expected:"m u\nd" },
				{ input:" m u\rd ", options:{replacement:"\t"}, expected:"m\tu\td" },
				// { input:``, options:undefined, expected:`` },
			];

			tests.forEach(({ input, options, expected }) => {
				test(tagLiterals`cleanWhitespace(${input}, ${options}) === ${expected}`, () => {
					expect(cleanWhitespace(input, options)).toBe(expected);
				});
			});

		});
	});
});