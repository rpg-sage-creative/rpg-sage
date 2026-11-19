import { describe, expect, test } from "vitest";
import { toHumanReadableLevel } from "../build/index.js";

describe("toHumanReadableLevel", () => {

	describe("string input (checked against pino's levels.values keys)", () => {

		test(`valid level names pass through unchanged`, () => {
			expect(toHumanReadableLevel("trace")).toBe("trace");
			expect(toHumanReadableLevel("debug")).toBe("debug");
			expect(toHumanReadableLevel("info")).toBe("info");
			expect(toHumanReadableLevel("warn")).toBe("warn");
			expect(toHumanReadableLevel("error")).toBe("error");
			expect(toHumanReadableLevel("fatal")).toBe("fatal");
		});

		test(`unknown strings return undefined`, () => {
			expect(toHumanReadableLevel("bogus")).toBeUndefined();
			expect(toHumanReadableLevel("Info")).toBeUndefined();
			expect(toHumanReadableLevel("")).toBeUndefined();
		});

		test(`numeric strings are NOT looked up as level numbers — only values.keys membership is checked`, () => {
			expect(toHumanReadableLevel("30")).toBeUndefined();
		});

	});

	describe("number input (looked up in pino's levels.labels)", () => {

		test(`standard pino v10 label numbers map to their labels`, () => {
			expect(toHumanReadableLevel(10)).toBe("trace");
			expect(toHumanReadableLevel(20)).toBe("debug");
			expect(toHumanReadableLevel(30)).toBe("info");
			expect(toHumanReadableLevel(40)).toBe("warn");
			expect(toHumanReadableLevel(50)).toBe("error");
			// pino v10 uses the standard label map — fatal is 60, NOT the legacy pino-pre-v6 value of 35
			expect(toHumanReadableLevel(60)).toBe("fatal");
		});

		test(`numbers without a label entry return undefined`, () => {
			expect(toHumanReadableLevel(35)).toBeUndefined();
			expect(toHumanReadableLevel(99)).toBeUndefined();
			expect(toHumanReadableLevel(-1)).toBeUndefined();
			expect(toHumanReadableLevel(25.5)).toBeUndefined();
			expect(toHumanReadableLevel(NaN)).toBeUndefined();
		});

	});

	describe("other types always return undefined", () => {

		test(`boolean, null, and undefined`, () => {
			expect(toHumanReadableLevel(true)).toBeUndefined();
			expect(toHumanReadableLevel(false)).toBeUndefined();
			expect(toHumanReadableLevel(null)).toBeUndefined();
			expect(toHumanReadableLevel(undefined)).toBeUndefined();
		});

		test(`objects and arrays`, () => {
			expect(toHumanReadableLevel({})).toBeUndefined();
			expect(toHumanReadableLevel([])).toBeUndefined();
		});

		test(`no argument at all`, () => {
			expect((toHumanReadableLevel as () => string | undefined)()).toBeUndefined();
		});

	});

});
