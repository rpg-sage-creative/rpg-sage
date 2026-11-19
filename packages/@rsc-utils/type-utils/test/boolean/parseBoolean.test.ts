import { describe, expect, test } from "vitest";
import { parseBoolean } from "../../build/index.js";

describe("boolean", () => {
	describe("parseBoolean", () => {

		describe("true values", () => {
			test(`parseBoolean(true) === true`, () => expect(parseBoolean(true)).toBe(true));
			test(`parseBoolean(1) === true — the number 1`, () => expect(parseBoolean(1)).toBe(true));
			test(`parseBoolean("true") === true`, () => expect(parseBoolean("true")).toBe(true));
			test(`parseBoolean("t") === true — short form`, () => expect(parseBoolean("t")).toBe(true));
			test(`parseBoolean("1") === true — the string "1"`, () => expect(parseBoolean("1")).toBe(true));
			test(`parseBoolean("yes") === true`, () => expect(parseBoolean("yes")).toBe(true));
			test(`parseBoolean("y") === true`, () => expect(parseBoolean("y")).toBe(true));
		});

		describe("false values", () => {
			test(`parseBoolean(false) === false`, () => expect(parseBoolean(false)).toBe(false));
			test(`parseBoolean(0) === false — the number 0 is falsy-recognized, not just "falsy"`, () => expect(parseBoolean(0)).toBe(false));
			test(`parseBoolean("false") === false`, () => expect(parseBoolean("false")).toBe(false));
			test(`parseBoolean("f") === false — short form`, () => expect(parseBoolean("f")).toBe(false));
			test(`parseBoolean("0") === false — the string "0"`, () => expect(parseBoolean("0")).toBe(false));
			test(`parseBoolean("no") === false`, () => expect(parseBoolean("no")).toBe(false));
			test(`parseBoolean("n") === false`, () => expect(parseBoolean("n")).toBe(false));
		});

		describe("ignoreCase", () => {
			test(`parseBoolean("TRUE") === undefined — case-sensitive by default`, () => expect(parseBoolean("TRUE")).toBeUndefined());
			test(`parseBoolean("TRUE", true) === true`, () => expect(parseBoolean("TRUE", true)).toBe(true));
			test(`parseBoolean("T", true) === true — short form, upper-case`, () => expect(parseBoolean("T", true)).toBe(true));
			test(`parseBoolean("YES", true) === true`, () => expect(parseBoolean("YES", true)).toBe(true));
			test(`parseBoolean("FALSE") === undefined`, () => expect(parseBoolean("FALSE")).toBeUndefined());
			test(`parseBoolean("FALSE", true) === false`, () => expect(parseBoolean("FALSE", true)).toBe(false));
			test(`parseBoolean("F", true) === false — short form, upper-case`, () => expect(parseBoolean("F", true)).toBe(false));
			test(`parseBoolean("NO", true) === false`, () => expect(parseBoolean("NO", true)).toBe(false));

			// QUIRK: ignoreCase only applies to strings; non-strings keep their exact-match results.
			// The overloads also make (non-string, ignoreCase) uncallable — the runtime guard is broader than the signature.
			test(`parseBoolean(2, true) === undefined — ignoreCase does not coerce other numbers`, () => {
				// @ts-expect-error — no overload accepts a number value together with ignoreCase.
				expect(parseBoolean(2, true)).toBeUndefined();
			});
		});

		describe("unknown values", () => {
			test(`parseBoolean(null) === undefined`, () => expect(parseBoolean(null)).toBeUndefined());
			test(`parseBoolean(undefined) === undefined`, () => expect(parseBoolean(undefined)).toBeUndefined());
			test(`parseBoolean({}) === undefined`, () => expect(parseBoolean({})).toBeUndefined());
			test(`parseBoolean("") === undefined — empty string is neither true nor false`, () => expect(parseBoolean("")).toBeUndefined());
			test(`parseBoolean(new Date()) === undefined`, () => expect(parseBoolean(new Date())).toBeUndefined());
			test(`parseBoolean(Date.now()) === undefined — arbitrary numbers are not booleans`, () => expect(parseBoolean(Date.now())).toBeUndefined());
			test(`parseBoolean(-1) === undefined`, () => expect(parseBoolean(-1)).toBeUndefined());
			test(`parseBoolean("nope") === undefined`, () => expect(parseBoolean("nope")).toBeUndefined());
			test(`parseBoolean("yess") === undefined — near-misses are not coerced`, () => expect(parseBoolean("yess")).toBeUndefined());
			test(`parseBoolean("01") === undefined — numeric strings must match exactly`, () => expect(parseBoolean("01")).toBeUndefined());
		});

		// ensure that the function correctly allows itself to be used in a map/filter function
		test(`inputs.map(parseBoolean) is safe — index never satisfies ignoreCase === true`, () => {
			const inputs: unknown[] = ["TRUE", "true", 1, "nope"];
			// QUIRK: Array.map passes the numeric index as parseBoolean's second arg;
			// because ignoreCase is checked with strict === true, indices (0/1/2...) never enable case-insensitivity.
			expect(inputs.map(parseBoolean)).toEqual([undefined, true, true, undefined]);
		});

	});
});
