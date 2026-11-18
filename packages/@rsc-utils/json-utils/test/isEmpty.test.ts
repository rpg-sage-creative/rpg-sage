import { describe, expect, test } from "vitest";
import { isEmpty } from "../build/index.js";

describe("isEmpty", () => {

	test("isEmpty({}) === true", () => {
		expect(isEmpty({})).toBe(true);
	});

	test("isEmpty({ a:undefined }) === true (the only key is undefined)", () => {
		expect(isEmpty({ a:undefined })).toBe(true);
	});

	test("isEmpty({ a:null }) === false", () => {
		expect(isEmpty({ a:null })).toBe(false);
	});

	test("isEmpty(deleted) === true after the only key was deleted", () => {
		const object: { a?:"A" } = { a:"A" };
		delete object.a;
		expect(isEmpty(object)).toBe(true);
	});

	test("isEmpty(added) === true when the added key is undefined", () => {
		const object: { a?:"A" } = {};
		object.a = undefined;
		expect(isEmpty(object)).toBe(true);
	});

	test("isEmpty({ a:\"\" }) === false (empty string is not undefined)", () => {
		expect(isEmpty({ a:"" })).toBe(false);
	});

	test("isEmpty({ \"\":\"\" }) === false", () => {
		expect(isEmpty({ "":"" })).toBe(false);
	});

	test("isEmpty({ \"\":null }) === false", () => {
		expect(isEmpty({ "":null })).toBe(false);
	});

	test("isEmpty({ 0:null }) === false (index keys count)", () => {
		expect(isEmpty({ 0:null })).toBe(false);
	});

	// Object.keys on an array returns index keys, so a filled array is never empty
	test("isEmpty([1]) === false but isEmpty([]) === true (arrays are treated as key containers)", () => {
		expect(isEmpty([1])).toBe(false);
		expect(isEmpty([])).toBe(true);
	});

	// Object.keys(null/undefined) throws, so these inputs throw rather than return false
	test("isEmpty(null) throws a TypeError", () => {
		expect(() => isEmpty(null)).toThrow(TypeError);
	});

	test("isEmpty(undefined) throws a TypeError", () => {
		expect(() => isEmpty(undefined)).toThrow(TypeError);
	});

});
