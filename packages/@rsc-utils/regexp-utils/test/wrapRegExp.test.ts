import { describe, expect, test } from "vitest";
import { wrapRegExp } from "../build/index.js";

describe("regex", () => {
	describe("wrapRegExp", () => {

		test(`throws when pairs is undefined`, () => {
			expect(() => wrapRegExp(/\d+/, undefined!)).toThrow();
		});

		test(`returns the same regexp for empty pairs`, () => {
			const regexp = /\d+/;
			expect(wrapRegExp(regexp, [])).toBe(regexp);
		});

		test(`wraps in optional space and parens`, () => {
			const regexp = wrapRegExp(/\d+/, ["()"]);
			expect(regexp.source).toBe(/\(\s*(?:\d+)\s*\)/.source);
			expect(regexp.flags).toBe(``);
		});

		test(`with or also matches the bare source`, () => {
			const regexp = wrapRegExp(/\d+/, ["()"], { or:true });
			expect(regexp.source).toBe(/\(\s*(?:\d+)\s*\)|(?:\d+)/.source);
		});

		test(`wraps alternation sources in a non-capture group`, () => {
			const regexp = wrapRegExp(/\d+|\w+/, ["()"]);
			expect(regexp.source).toBe(/\(\s*(?:\d+|\w+)\s*\)/.source);
			const orRegexp = wrapRegExp(/\d+|\w+/, ["()"], { or:true });
			expect(orRegexp.source).toBe(/\(\s*(?:\d+|\w+)\s*\)|(?:\d+|\w+)/.source);
		});

		test(`wraps in pipe spoilers`, () => {
			const regexp = wrapRegExp(/\d+/, ["||||"]);
			expect(regexp.source).toBe(/\|\|\s*(?:\d+)\s*\|\|/.source);
			const orRegexp = wrapRegExp(/\d+/, ["||||"], { or:true });
			expect(orRegexp.source).toBe(/\|\|\s*(?:\d+)\s*\|\||(?:\d+)/.source);
		});

		test(`applies multiple pairs in order`, () => {
			const regexp = wrapRegExp(/\d+/, ["||||", "()"]);
			expect(regexp.source).toBe(/\(\s*(?:\|\|\s*(?:\d+)\s*\|\|)\s*\)/.source);
		});

		test(`with multiple pairs and or makes each layer optional`, () => {
			const regexp = wrapRegExp(/\d+/, ["||||", "()"], { or:true });
			expect(regexp.source).toBe(/\(\s*(?:\|\|\s*(?:\d+)\s*\|\||(?:\d+))\s*\)|(?:\|\|\s*(?:\d+)\s*\|\||(?:\d+))/.source);
		});

		// baseline
		test(`wrapRegExp(${/\d+/}, []).test()`, () => {
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

		test(`wrapRegExp(${/\d+/}, ["||||"]).test()`, () => {
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

		test(`wrapRegExp(${/\d+/}, ["||||"], { or:true }).test()`, () => {
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

		test(`wrapRegExp(${/\d+/}, ["()"]).test()`, () => {
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

		test(`wrapRegExp(${/\d+/}, ["()"], { or:true }).test()`, () => {
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

		test(`wrapRegExp(${/\d+/}, ["||||", "()"]).test()`, () => {
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

		test(`wrapRegExp(${/\d+/}, ["||||", "()"], { or:true }).test()`, () => {
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
