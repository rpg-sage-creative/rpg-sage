import { describe, expect, test } from "vitest";
import { typeError } from "../build/index.js";

describe("typeError", () => {

	test(`creates a TypeError`, () => {
		expect(typeError({ argKey:`count`, mustBe:`a number`, value:`x` })).toBeInstanceOf(TypeError);
	});

	test(`null is received as "null"`, () => {
		const error = typeError({ argKey:`v`, mustBe:`defined`, value:null });
		expect(error.message).toBe(`The "v" argument must be defined. Received null`);
	});

	test(`undefined is received as "undefined"`, () => {
		const error = typeError({ argKey:`v`, mustBe:`defined`, value:undefined });
		expect(error.message).toBe(`The "v" argument must be defined. Received undefined`);
	});

	test(`string values show the quoted value with its type`, () => {
		const error = typeError({ argKey:`v`, mustBe:`a number`, value:`x` });
		expect(error.message).toBe(`The "v" argument must be a number. Received type string ('x')`);
	});

	test(`other values show the typeof and coerced value`, () => {
		expect(typeError({ argKey:`v`, mustBe:`a number`, value:{} }).message).toContain(`Received type object ([object Object])`);
		expect(typeError({ argKey:`v`, mustBe:`a string`, value:42 }).message).toContain(`Received type number (42)`);
	});

	test(`the stack does not include the typeError frame itself`, () => {
		const error = typeError({ argKey:`v`, mustBe:`x`, value:1 });
		expect(error.stack).not.toContain(`at typeError (`);
	});

});
