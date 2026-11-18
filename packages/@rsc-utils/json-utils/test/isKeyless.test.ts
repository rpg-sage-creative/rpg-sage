import { describe, expect, test } from "vitest";
import { isKeyless } from "../build/index.js";

describe("isKeyless", () => {

	test("isKeyless({}) === true", () => {
		expect(isKeyless({})).toBe(true);
	});

	test("isKeyless({ a:undefined }) === false (the key exists)", () => {
		expect(isKeyless({ a:undefined })).toBe(false);
	});

	test("isKeyless({ a:null }) === false", () => {
		expect(isKeyless({ a:null })).toBe(false);
	});

	test("isKeyless(deleted) === true after the only key was deleted", () => {
		const object: { a?:"A" } = { a:"A" };
		delete object.a;
		expect(isKeyless(object)).toBe(true);
	});

	test("isKeyless(added) === false when the added key is undefined", () => {
		const object: { a?:"A" } = {};
		object.a = undefined;
		expect(isKeyless(object)).toBe(false);
	});

	test("isKeyless({ a:\"\" }) === false", () => {
		expect(isKeyless({ a:"" })).toBe(false);
	});

	test("isKeyless({ \"\":\"\" }) === false (the empty-string key counts)", () => {
		expect(isKeyless({ "":"" })).toBe(false);
	});

	test("isKeyless({ \"\":null }) === false", () => {
		expect(isKeyless({ "":null })).toBe(false);
	});

	test("isKeyless({ 0:null }) === false (index keys count)", () => {
		expect(isKeyless({ 0:null })).toBe(false);
	});

	// Object.keys on an array returns index keys, so a filled array is never keyless
	test("isKeyless([1]) === false but isKeyless([]) === true (arrays are treated as key containers)", () => {
		expect(isKeyless([1])).toBe(false);
		expect(isKeyless([])).toBe(true);
	});

	// Object.keys(null/undefined) throws, so these inputs throw rather than return false
	test("isKeyless(null) throws a TypeError", () => {
		expect(() => isKeyless(null)).toThrow(TypeError);
	});

	test("isKeyless(undefined) throws a TypeError", () => {
		expect(() => isKeyless(undefined)).toThrow(TypeError);
	});

});
