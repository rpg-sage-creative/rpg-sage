import { describe, expect, test } from "vitest";
import { cleanJson, type JsonCleanRules, stringifyJson } from "../build/index.js";

type TestData = [
	object,
	JsonCleanRules | undefined,
	object
];

describe("json", () => {
	describe("cleanJson", () => {

		// [input, options, output, "toStrictEqual"?]
		const tests: TestData[] = [
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

			// recursive cleans objects inside arrays but never removes array elements
			[[{ a:undefined }, { b:1 }], { deleteUndefined:true, recursive:true }, [{ }, { b:1 }]],

			// without recursion an object is neither cleaned nor deleted for being "empty"
			[{ b:{ c:undefined } }, { deleteEmptyObject:true }, { b:{ c:undefined } }],

			// dates are kept as-is
			[{ a:new Date("2020-01-01T00:00:00.000Z"), b:undefined }, undefined, { a:new Date("2020-01-01T00:00:00.000Z") }],
		];

		tests.forEach(([input, options, output]) => {
			test(`cleanJson(${stringifyJson(input)}, ${stringifyJson(options)}) strictly equals ${stringifyJson(output)}`, () => {
				expect(cleanJson(input, options as JsonCleanRules)).toStrictEqual(output);
			});
		});

		// [input, output] using the "scrub" rules (delete falsey values and empty arrays/objects recursively)
		const scrubTests: [object, object][] = [
			[{ a:1, b:null, c:false, d:"", e:{ f:undefined }, g:[], h:0 }, { a:1 }],
			[{ a:"Apple", b:null }, { a:"Apple" }],
			[{ a:{ b:false, c:"x" } }, { a:{ c:"x" } }],
			// array elements are never deleted, even with "scrub"
			[[1, null, "", {}], [1, null, "", {}]],
		];

		scrubTests.forEach(([input, output]) => {
			test(`cleanJson(${stringifyJson(input)}, "scrub") strictly equals ${stringifyJson(output)}`, () => {
				expect(cleanJson(input, "scrub")).toStrictEqual(output);
			});
		});
	});
});