import { describe, expect, test } from "vitest";
import { encodeJson, prettifyJson, stringifyJson } from "../build/index.js";

const date = new Date("2020-06-01T12:34:56.789Z");

describe("stringifyJson (deprecated)", () => {

	// the shim is a router: maxLineLength routes to prettifyJson, everything else to encodeJson
	// behavior itself is pinned by encodeJson.test.ts and prettifyJson.test.ts — these tests only pin the routing

	test("without maxLineLength stringifyJson delegates to encodeJson", () => {
		const object = { a:"Apple", b:1n, d:date };
		expect(stringifyJson(object)).toBe(encodeJson(object));
		expect(stringifyJson(object, null, 2)).toBe(encodeJson(object, null, 2));
		expect(stringifyJson(undefined)).toBe(encodeJson(undefined));
	});

	test("with maxLineLength stringifyJson delegates to prettifyJson", () => {
		const object = { one:"One", two:[2, 3, 4] };
		expect(stringifyJson(object, null, undefined, 250)).toBe(prettifyJson(object, 250));
	});

	// the deprecated signature (value, replacer, space, maxLineLength) must forward replacer and space intact
	test("stringifyJson forwards replacer and space to prettifyJson", () => {
		const object = { a:"x{ y   z }w" };
		expect(stringifyJson(object, null, 2, 80)).toBe(prettifyJson(object, 80, null, 2));
	});

	// end-to-end sanity: the special-value wrapping is still reachable through the deprecated entry point
	test("stringifyJson still wraps bigint and Date values", () => {
		expect(stringifyJson({ b:1n, d:date })).toBe('{"b":{"$bigint":"1"},"d":{"$date":"2020-06-01T12:34:56.789Z"}}');
	});

});
