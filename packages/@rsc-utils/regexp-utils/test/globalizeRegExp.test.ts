import { describe, expect, test } from "vitest";
import { globalizeRegExp } from "../build/index.js";

/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape
*/

describe("globalizeRegExp", () => {

	test(`adds g to a flagless regexp`, () => {
		const regexp = globalizeRegExp(/a/);
		expect(regexp.source).toBe(`a`);
		expect(regexp.flags).toBe(`g`);
	});

	test(`adds g in canonical flag order for each single non-global flag`, () => {
		expect(globalizeRegExp(/a/i).flags).toBe(`gi`);
		expect(globalizeRegExp(/a/m).flags).toBe(`gm`);
		expect(globalizeRegExp(/a/u).flags).toBe(`gu`);
		expect(globalizeRegExp(/a/v).flags).toBe(`gv`);
		expect(globalizeRegExp(/a/y).flags).toBe(`gy`);
	});

	test(`keeps already-global regexps unchanged`, () => {
		expect(globalizeRegExp(/a/g).flags).toBe(`g`);
		expect(globalizeRegExp(/a/ig).flags).toBe(`gi`);
		expect(globalizeRegExp(/a/mg).flags).toBe(`gm`);
		expect(globalizeRegExp(/a/ug).flags).toBe(`gu`);
		expect(globalizeRegExp(/a/vg).flags).toBe(`gv`);
		expect(globalizeRegExp(/a/yg).flags).toBe(`gy`);
	});

	test(`normalizes flags when g leads the input flags`, () => {
		// RegExp.prototype.flags always reports canonical order, regardless of construction order
		expect(globalizeRegExp(/a/gi).flags).toBe(`gi`);
		expect(globalizeRegExp(/a/gm).flags).toBe(`gm`);
		expect(globalizeRegExp(/a/gu).flags).toBe(`gu`);
		expect(globalizeRegExp(/a/gv).flags).toBe(`gv`);
		expect(globalizeRegExp(/a/gy).flags).toBe(`gy`);
	});

	test(`keeps the source unchanged`, () => {
		const regexp = globalizeRegExp(/\d{2,4}/g);
		expect(regexp.source).toBe(`\\d{2,4}`);
	});

	test(`returns a new instance so lastIndex state is not shared`, () => {
		const regexp = /a/g;
		const clone = globalizeRegExp(regexp);
		expect(clone).not.toBe(regexp);
		expect(clone.global).toBe(true);
	});

});
