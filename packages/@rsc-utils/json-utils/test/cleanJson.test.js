import { tagLiterals } from "@rsc-utils//template-literal-utils";
import { cleanJson } from "../build/index.js";

describe("json", () => {
	describe("cleanJson", () => {

		// [input, options, output, "toStrictEqual"?]
		const tests = [
			// deleteBlankString
			[{ a:"Apple", b:"" }, { }, { a:"Apple", b:"" }],
			[{ a:"Apple", b:"" }, { deleteBlankString:true }, { a:"Apple" }],
			[{ a:"Apple", b:" " }, { deleteBlankString:true }, { a:"Apple" }],
			[{ a:"Apple", b:"\t" }, { deleteBlankString:true }, { a:"Apple" }],
			[{ a:"Apple", b:"\n" }, { deleteBlankString:true }, { a:"Apple" }],

			// deleteEmptyArray
			[{ a:["Apple"], b:[] }, { }, { a:["Apple"], b:[] }],
			[{ a:["Apple"], b:[] }, { deleteEmptyArray:true }, { a:["Apple"] }],

			// deleteEmptyObject
			[{ a:{a:"Apple"}, b:{} }, { }, { a:{a:"Apple"}, b:{} }],
			[{ a:{a:"Apple"}, b:{} }, { deleteEmptyObject:true }, { a:{a:"Apple"} }],

			// deleteEmptyString
			[{ a:"Apple", b:"" }, { }, { a:"Apple", b:"" }],
			[{ a:"Apple", b:"" }, { deleteEmptyString:true }, { a:"Apple" }],
			[{ a:"Apple", b:" " }, { deleteEmptyString:true }, { a:"Apple", b:" " }],
			[{ a:"Apple", b:"\t" }, { deleteEmptyString:true }, { a:"Apple", b:"\t" }],
			[{ a:"Apple", b:"\n" }, { deleteEmptyString:true }, { a:"Apple", b:"\n" }],

			// deleteFalse
			[{ a:"Apple", b:false }, { }, { a:"Apple", b:false }],
			[{ a:"Apple", b:false }, { deleteFalse:true }, { a:"Apple" }],

			// deleteNaN
			[{ a:"Apple", b:NaN }, { }, { a:"Apple", b:NaN }],
			[{ a:"Apple", b:NaN }, { deleteNaN:true }, { a:"Apple" }],

			// deleteNull
			[{ a:"Apple", b:null }, { }, { a:"Apple", b:null }],
			[{ a:"Apple", b:null }, { deleteNull:true }, { a:"Apple" }],

			// deleteUndefined
			[{ a:"Apple", b:undefined }, undefined, { a:"Apple" }],
			[{ a:"Apple", b:undefined }, { }, { a:"Apple", b:undefined }],
			[{ a:"Apple", b:undefined }, { deleteUndefined:true }, { a:"Apple" }],

			// deleteZero
			[{ a:"Apple", b:0 }, { }, { a:"Apple", b:0 }],
			[{ a:"Apple", b:0n }, { }, { a:"Apple", b:0n }],
			[{ a:"Apple", b:0 }, { deleteZero:true }, { a:"Apple" }],
			[{ a:"Apple", b:+0 }, { deleteZero:true }, { a:"Apple" }],
			[{ a:"Apple", b:-0 }, { deleteZero:true }, { a:"Apple" }],
			[{ a:"Apple", b:0n }, { deleteZero:true }, { a:"Apple" }],

			// recursive
			[{ a:"Apple", b:{ c:undefined } }, { }, { a:"Apple", b:{ c:undefined } }],
			[{ a:"Apple", b:{ c:undefined } }, { deleteUndefined:true, recursive:true }, { a:"Apple", b:{ } }],
			[{ a:"Apple", b:{ c:undefined } }, { deleteEmptyObject:true, deleteUndefined:true, recursive:true }, { a:"Apple" }],
		];

		tests.forEach(([input, options, output, comparer]) => {
			test(tagLiterals`cleanJson(${input}, ${options}) strictly equals ${output}`, () => {
				expect(cleanJson(input, options)).toStrictEqual(output);
			});
		});
	});
});