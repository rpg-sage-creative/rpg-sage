import { describe, expect, test } from "vitest";
import { noop } from "../build/index.js";

describe("noop", () => {

	test(`noop() returns undefined`, () => {
		expect(noop()).toBeUndefined();
	});

	test(`noop is a function`, () => {
		expect(typeof noop).toBe("function");
	});

	test(`noop tolerates extra arguments from callbacks like .map/.forEach`, () => {
		// the declared overloads take no parameters, so callers pass it where zero-arg callbacks fit;
		// at runtime Array#map hands it (value, index, array) and nothing throws.
		expect([1,2].map(noop)).toEqual([undefined, undefined]);
	});

	test(`repeated calls all return undefined`, () => {
		expect(noop()).toBeUndefined();
		expect(noop()).toBeUndefined();
	});

});
