import { describe, expect, test } from "vitest";
import { boundNumber } from "../build/index.js";

describe("boundNumber", () => {

	describe("values inside the bounds pass through", () => {

		test(`5 within min 0 / max 10 → 5`, () => {
			expect(boundNumber(5, { min: 0, max: 10 })).toBe(5);
		});

		test(`no bounds at all — the value is returned as-is`, () => {
			expect(boundNumber(5, {})).toBe(5);
		});

		test(`min alone — anything above it passes`, () => {
			expect(boundNumber(1000, { min: 0 })).toBe(1000);
		});

		test(`max alone — anything below it passes`, () => {
			expect(boundNumber(-1000, { max: 0 })).toBe(-1000);
		});

	});

	describe("bounds are inclusive", () => {

		test(`value equal to min is in bounds`, () => {
			expect(boundNumber(0, { min: 0 })).toBe(0);
		});

		test(`value equal to max is in bounds`, () => {
			expect(boundNumber(10, { max: 10 })).toBe(10);
		});

	});

	describe("out-of-bounds returns the default — it does NOT clamp", () => {

		test(`below min with no default → undefined (not clamped to min)`, () => {
			expect(boundNumber(-1, { min: 0, max: 10 })).toBe(undefined);
		});

		test(`above max with no default → undefined (not clamped to max)`, () => {
			expect(boundNumber(11, { min: 0, max: 10 })).toBe(undefined);
		});

		test(`below min with a default → the default`, () => {
			expect(boundNumber(-1, { min: 0, max: 10, default: 0 })).toBe(0);
		});

		test(`above max with a default → the default`, () => {
			expect(boundNumber(11, { min: 0, max: 10, default: 99 })).toBe(99);
		});

		test(`a default of 0 is distinguishable from "no default" (falsy defaults are honored)`, () => {
			expect(boundNumber(-1, { min: 0, default: 0 })).toBe(0);
		});

	});

	describe("non-finite or non-number values yield the default", () => {

		test(`undefined value → default`, () => {
			expect(boundNumber(undefined, { default: 7 })).toBe(7);
		});

		test(`NaN value → default even when within numeric bounds`, () => {
			expect(boundNumber(NaN, { min: 0, max: 10, default: 7 })).toBe(7);
		});

		test(`undefined value with no default → undefined`, () => {
			expect(boundNumber(undefined, {})).toBe(undefined);
		});

		test(`-Infinity is explicitly boundless — never confined, yields the default`, () => {
			expect(boundNumber(-Infinity, { min: 0, default: 7 })).toBe(7);
		});

		test(`+Infinity is explicitly boundless too`, () => {
			expect(boundNumber(Infinity, { max: 10, default: 7 })).toBe(7);
		});

	});

	describe("quirks", () => {

		test(`contradictory bounds (min > max) put every value out of range`, () => {
			expect(boundNumber(5, { min: 10, max: 0 })).toBe(undefined);
			expect(boundNumber(5, { min: 10, max: 0, default: -1 })).toBe(-1);
		});

		test(`non-number bounds from untyped callers are ignored, not coerced — a null min does NOT act as 0`, () => {
			expect(boundNumber(-1, { min: null as unknown as number })).toBe(-1);
		});

		test(`±Infinity VALUES are explicitly boundless — they yield the default even when no opposing bound exists`, () => {
			expect(boundNumber(Infinity, { min: 0 })).toBe(undefined);
			expect(boundNumber(-Infinity, { max: 10 })).toBe(undefined);
			expect(boundNumber(Infinity, { default: -1 })).toBe(-1);
		});

		test(`non-finite bounds are ignored — omit min/max to leave a side unbounded`, () => {
			expect(boundNumber(-999_999, { min: -Infinity })).toBe(-999_999);
			expect(boundNumber(999_999, { max: Infinity })).toBe(999_999);
			expect(boundNumber(5, { min: NaN })).toBe(5);
		});

		test(`inverted infinite bounds are ignored too — they do NOT reject every value the way comparing against them would`, () => {
			expect(boundNumber(5, { min: Infinity })).toBe(5);
			expect(boundNumber(5, { max: -Infinity })).toBe(5);
		});

		test(`ignoring a non-finite bound does not disable the other bound`, () => {
			expect(boundNumber(50, { min: -Infinity, max: 10 })).toBe(undefined);
		});

	});

});
