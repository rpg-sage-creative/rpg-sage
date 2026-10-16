import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { wrapRegExp } from "../build/index.js";

describe("regex", () => {
	describe("wrapRegExp", () => {

		const tests: { input:RegExp; pairs?:string[]; options?:{or?:boolean;}; expected?:RegExp; toThrow?:boolean; }[] = [
			{ input:/\d+/, pairs:undefined, options:undefined, toThrow:true },
			{ input:/\d+/, pairs:[], options:undefined, expected:/\d+/ },
			{ input:/\d+/, pairs:["()"], options:undefined, expected:/\(\s*(?:\d+)\s*\)/ },
			{ input:/\d+/, pairs:["()"], options:{or:true}, expected:/\(\s*(?:\d+)\s*\)|(?:\d+)/ },
			{ input:/\d+|\w+/, pairs:["()"], options:undefined, expected:/\(\s*(?:\d+|\w+)\s*\)/ },
			{ input:/\d+|\w+/, pairs:["()"], options:{or:true}, expected:/\(\s*(?:\d+|\w+)\s*\)|(?:\d+|\w+)/ },
			{ input:/\d+/, pairs:["||||"], options:undefined, expected:/\|\|\s*(?:\d+)\s*\|\|/ },
			{ input:/\d+/, pairs:["||||"], options:{or:true}, expected:/\|\|\s*(?:\d+)\s*\|\||(?:\d+)/ },
			{ input:/\d+/, pairs:["||||", "()"], options:undefined, expected:/\(\s*(?:\|\|\s*(?:\d+)\s*\|\|)\s*\)/ },
			{ input:/\d+/, pairs:["||||", "()"], options:{or:true}, expected:/\(\s*(?:\|\|\s*(?:\d+)\s*\|\||(?:\d+))\s*\)|(?:\|\|\s*(?:\d+)\s*\|\||(?:\d+))/ },
		];

		tests.forEach(({ input, pairs, options, expected, toThrow }) => {
			if (toThrow) {
				test(tagLiterals`wrapRegExp(${input}, ${pairs}, ${options}) === ${expected}`, () => {
					expect(() => wrapRegExp(input, pairs!, options)).toThrow();
				});
			}else {
				test(tagLiterals`wrapRegExp(${input}, ${pairs}, ${options}) === ${expected}`, () => {
					const regexp = wrapRegExp(input, pairs!, options);
					expect(regexp.source).toBe(expected?.source);
					expect(regexp.flags).toBe(expected?.flags);
				});
			}
		});

		// baseline
		test(tagLiterals`wrapRegExp(${/\d+/}, []).test()`, () => {
			const regexp = wrapRegExp(/\d+/, []);
			expect(regexp.test("")).toBe(false);
			expect(regexp.test("a")).toBe(false);

			expect(Array.from(regexp.exec("nothing 1 here")!)).toEqual(["1"]);
			expect(Array.from(regexp.exec("nothing 12 here")!)).toEqual(["12"]);

			expect(Array.from(regexp.exec("nothing ||1|| here")!)).toEqual(["1"]);
			expect(Array.from(regexp.exec("nothing ||12|| here")!)).toEqual(["12"]);
			expect(Array.from(regexp.exec("nothing || 12 || here")!)).toEqual(["12"]);

			expect(Array.from(regexp.exec("nothing (1) here")!)).toEqual(["1"]);
			expect(Array.from(regexp.exec("nothing (12) here")!)).toEqual(["12"]);
			expect(Array.from(regexp.exec("nothing ( 12 ) here")!)).toEqual(["12"]);

			expect(Array.from(regexp.exec("nothing (||1 ||) here")!)).toEqual(["1"]);
			expect(Array.from(regexp.exec("nothing (||12||) here")!)).toEqual(["12"]);
			expect(Array.from(regexp.exec("nothing ( || 12 || ) here")!)).toEqual(["12"]);
		});

		test(tagLiterals`wrapRegExp(${/\d+/}, ["||||"]).test()`, () => {
			const regexp = wrapRegExp(/\d+/, ["||||"]);
			expect(regexp.test("")).toBe(false);
			expect(regexp.test("a")).toBe(false);

			expect(regexp.exec("nothing 1 here")).toBeNull();
			expect(regexp.exec("nothing 12 here")).toBeNull();

			expect(Array.from(regexp.exec("nothing ||1|| here")!)).toEqual(["||1||"]);
			expect(Array.from(regexp.exec("nothing ||12|| here")!)).toEqual(["||12||"]);
			expect(Array.from(regexp.exec("nothing || 12 || here")!)).toEqual(["|| 12 ||"]);

			expect(regexp.exec("nothing (1) here")).toBeNull();
			expect(regexp.exec("nothing (12) here")).toBeNull();
			expect(regexp.exec("nothing ( 12 ) here")).toBeNull();

			expect(Array.from(regexp.exec("nothing (||1 ||) here")!)).toEqual(["||1 ||"]);
			expect(Array.from(regexp.exec("nothing (||12||) here")!)).toEqual(["||12||"]);
			expect(Array.from(regexp.exec("nothing ( || 12 || ) here")!)).toEqual(["|| 12 ||"]);
		});

		test(tagLiterals`wrapRegExp(${/\d+/}, ["||||"], { or:true }).test()`, () => {
			const regexp = wrapRegExp(/\d+/, ["||||"], { or:true });
			expect(regexp.test("")).toBe(false);
			expect(regexp.test("a")).toBe(false);

			expect(Array.from(regexp.exec("nothing 1 here")!)).toEqual(["1"]);
			expect(Array.from(regexp.exec("nothing 12 here")!)).toEqual(["12"]);

			expect(Array.from(regexp.exec("nothing ||1|| here")!)).toEqual(["||1||"]);
			expect(Array.from(regexp.exec("nothing ||12|| here")!)).toEqual(["||12||"]);
			expect(Array.from(regexp.exec("nothing || 12 || here")!)).toEqual(["|| 12 ||"]);

			expect(Array.from(regexp.exec("nothing (1) here")!)).toEqual(["1"]);
			expect(Array.from(regexp.exec("nothing (12) here")!)).toEqual(["12"]);
			expect(Array.from(regexp.exec("nothing ( 12 ) here")!)).toEqual(["12"]);

			expect(Array.from(regexp.exec("nothing (||1 ||) here")!)).toEqual(["||1 ||"]);
			expect(Array.from(regexp.exec("nothing (||12||) here")!)).toEqual(["||12||"]);
			expect(Array.from(regexp.exec("nothing ( || 12 || ) here")!)).toEqual(["|| 12 ||"]);
		});

		test(tagLiterals`wrapRegExp(${/\d+/}, ["()"]).test()`, () => {
			const regexp = wrapRegExp(/\d+/, ["()"]);
			expect(regexp.test("")).toBe(false);
			expect(regexp.test("a")).toBe(false);

			expect(regexp.exec("nothing 1 here")).toBeNull();
			expect(regexp.exec("nothing 12 here")).toBeNull();

			expect(regexp.exec("nothing ||1|| here")).toBeNull();
			expect(regexp.exec("nothing ||12|| here")).toBeNull();
			expect(regexp.exec("nothing || 12 || here")).toBeNull();

			expect(Array.from(regexp.exec("nothing (1) here")!)).toEqual(["(1)"]);
			expect(Array.from(regexp.exec("nothing (12) here")!)).toEqual(["(12)"]);
			expect(Array.from(regexp.exec("nothing ( 12 ) here")!)).toEqual(["( 12 )"]);

			expect(regexp.exec("nothing (||1 ||) here")).toBeNull();
			expect(regexp.exec("nothing (||12||) here")).toBeNull();
			expect(regexp.exec("nothing ( || 12 || ) here")).toBeNull();
		});

		test(tagLiterals`wrapRegExp(${/\d+/}, ["()"], { or:true }).test()`, () => {
			const regexp = wrapRegExp(/\d+/, ["()"], { or:true });
			expect(regexp.test("")).toBe(false);
			expect(regexp.test("a")).toBe(false);

			expect(Array.from(regexp.exec("nothing 1 here")!)).toEqual(["1"]);
			expect(Array.from(regexp.exec("nothing 12 here")!)).toEqual(["12"]);

			expect(Array.from(regexp.exec("nothing ||1|| here")!)).toEqual(["1"]);
			expect(Array.from(regexp.exec("nothing ||12|| here")!)).toEqual(["12"]);
			expect(Array.from(regexp.exec("nothing || 12 || here")!)).toEqual(["12"]);

			expect(Array.from(regexp.exec("nothing (1) here")!)).toEqual(["(1)"]);
			expect(Array.from(regexp.exec("nothing (12) here")!)).toEqual(["(12)"]);
			expect(Array.from(regexp.exec("nothing ( 12 ) here")!)).toEqual(["( 12 )"]);

			expect(Array.from(regexp.exec("nothing (||1 ||) here")!)).toEqual(["1"]);
			expect(Array.from(regexp.exec("nothing (||12||) here")!)).toEqual(["12"]);
			expect(Array.from(regexp.exec("nothing ( || 12 || ) here")!)).toEqual(["12"]);
		});

		test(tagLiterals`wrapRegExp(${/\d+/}, ["||||", "()"]).test()`, () => {
			const regexp = wrapRegExp(/\d+/, ["||||", "()"]);
			expect(regexp.test("")).toBe(false);
			expect(regexp.test("a")).toBe(false);

			expect(regexp.exec("nothing 1 here")).toBeNull();
			expect(regexp.exec("nothing 12 here")).toBeNull();

			expect(regexp.exec("nothing ||1|| here")).toBeNull();
			expect(regexp.exec("nothing ||12|| here")).toBeNull();
			expect(regexp.exec("nothing || 12 || here")).toBeNull();

			expect(regexp.exec("nothing (1) here")).toBeNull();
			expect(regexp.exec("nothing (12) here")).toBeNull();
			expect(regexp.exec("nothing ( 12 ) here")).toBeNull();

			expect(Array.from(regexp.exec("nothing (||1 ||) here")!)).toEqual(["(||1 ||)"]);
			expect(Array.from(regexp.exec("nothing (||12||) here")!)).toEqual(["(||12||)"]);
			expect(Array.from(regexp.exec("nothing ( || 12 || ) here")!)).toEqual(["( || 12 || )"]);
		});

		test(tagLiterals`wrapRegExp(${/\d+/}, ["||||", "()"], { or:true }).test()`, () => {
			const regexp = wrapRegExp(/\d+/, ["||||", "()"], { or:true });
			expect(regexp.test("")).toBe(false);
			expect(regexp.test("a")).toBe(false);

			expect(Array.from(regexp.exec("nothing 1 here")!)).toEqual(["1"]);
			expect(Array.from(regexp.exec("nothing 12 here")!)).toEqual(["12"]);

			expect(Array.from(regexp.exec("nothing ||1|| here")!)).toEqual(["||1||"]);
			expect(Array.from(regexp.exec("nothing ||12|| here")!)).toEqual(["||12||"]);
			expect(Array.from(regexp.exec("nothing || 12 || here")!)).toEqual(["|| 12 ||"]);

			expect(Array.from(regexp.exec("nothing (1) here")!)).toEqual(["(1)"]);
			expect(Array.from(regexp.exec("nothing (12) here")!)).toEqual(["(12)"]);
			expect(Array.from(regexp.exec("nothing ( 12 ) here")!)).toEqual(["( 12 )"]);

			expect(Array.from(regexp.exec("nothing (||1 ||) here")!)).toEqual(["(||1 ||)"]);
			expect(Array.from(regexp.exec("nothing (||12||) here")!)).toEqual(["(||12||)"]);
			expect(Array.from(regexp.exec("nothing ( || 12 || ) here")!)).toEqual(["( || 12 || )"]);

			expect(Array.from(regexp.exec("nothing || (1) || here")!)).toEqual(["(1)"]);
			expect(Array.from(regexp.exec("nothing ||(12)|| here")!)).toEqual(["(12)"]);
			expect(Array.from(regexp.exec("nothing || ( 123 ) || here")!)).toEqual(["( 123 )"]);
		});
	});
});
