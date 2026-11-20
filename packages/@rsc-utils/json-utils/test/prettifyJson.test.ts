import { describe, expect, test } from "vitest";
import { prettifyJson } from "../build/index.js";

describe("prettifyJson", () => {

	// pretty by default: tab-indented, no inlining without maxLineLength

	test("prettifyJson indents with tabs by default", () => {
		expect(prettifyJson({ a:1 })).toBe('{\n\t"a": 1\n}');
	});

	// JSON.stringify(undefined) returns undefined instead of a string — the guard must not .replace on it
	// regression (fixed 2026-11-19): maxLineLength > 0 used to crash calling .replace on JSON.stringify's undefined result

	test("prettifyJson(undefined) with maxLineLength returns undefined instead of throwing", () => {
		expect(prettifyJson(undefined, 80)).toBeUndefined();
	});

	// functions and symbols at the root also stringify to undefined
	test("prettifyJson(function) at the root with maxLineLength returns undefined instead of throwing", () => {
		expect(() => prettifyJson(() => {}, 80)).not.toThrow();
		expect(prettifyJson(() => {}, 80)).toBeUndefined();
	});

	test("prettifyJson(symbol) at the root with maxLineLength returns undefined instead of throwing", () => {
		expect(prettifyJson(Symbol("s"), 80)).toBeUndefined();
	});

	// a replacer that drops the root value makes JSON.stringify return undefined for it too
	test("prettifyJson with a replacer that drops the root returns undefined instead of throwing", () => {
		expect(prettifyJson({ a:1 }, 80, () => undefined)).toBeUndefined();
	});

	// defined output must still be inline-processed when maxLineLength is given (the fix must not skip real values)
	test("prettifyJson still inlines defined output when maxLineLength is given", () => {
		expect(prettifyJson({ one:"One" }, 250)).toBe('{ "one": "One" }');
	});

	// maxLineLength inlining

	test("prettifyJson inlines a short object on one line with maxLineLength", () => {
		const object = { one:"One", two:2 };
		expect(prettifyJson(object, 250)).toBe('{ "one": "One", "two": 2 }');
	});

	test("prettifyJson inlines a short array but keeps the outer object multiline", () => {
		const object = { one:"One", two:[2, 3, 4] };
		expect(prettifyJson(object, 250)).toBe('{\n\t"one": "One",\n\t"two": [ 2, 3, 4 ]\n}');
	});

	test("prettifyJson inlines only the innermost short containers (nested braces stay multiline)", () => {
		const object = { one:"One", two:["2", { three:[3] }], four:"4" };
		expect(prettifyJson(object, 250)).toBe('{\n\t"one": "One",\n\t"two": [\n\t\t"2",\n\t\t{\n\t\t\t"three": [ 3 ]\n\t\t}\n\t],\n\t"four": "4"\n}');
	});

	// a falsy space is forced to "\t", including an explicit 0; an explicit truthy space is honored
	test("prettifyJson overrides an explicit space=0 with a tab when maxLineLength is given", () => {
		expect(prettifyJson({ a:1 }, 50, null, 0)).toBe('{ "a": 1 }');
	});

	test("prettifyJson honors an explicit space for the multiline skeleton", () => {
		expect(prettifyJson({ one:"One", two:[2, 3, 4] }, 250, null, 2)).toBe('{\n  "one": "One",\n  "two": [ 2, 3, 4 ]\n}');
	});

	// the inline regexes also match brace/bracket pairs inside string values and collapse their whitespace
	test("prettifyJson collapses whitespace inside braces in string values (quirk)", () => {
		expect(prettifyJson({ a:"x{ y   z }w" }, 80, null, 2)).toBe('{\n  "a": "x{ y z }w"\n}');
	});

	test("prettifyJson collapses whitespace inside brackets in string values (quirk)", () => {
		expect(prettifyJson({ a:"p[ q   r ]s" }, 80, null, 2)).toBe('{\n  "a": "p[ q r ]s"\n}');
	});

});
