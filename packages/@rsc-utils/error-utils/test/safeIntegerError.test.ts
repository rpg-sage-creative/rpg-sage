import { describe, expect, test } from "vitest";
import { safeIntegerError } from "../build/index.js";

describe("safeIntegerError", () => {

	describe("error type selection", () => {

		test(`a number value produces a RangeError`, () => {
			expect(safeIntegerError({ argKey:`count`, value:9 }).constructor).toBe(RangeError);
		});

		test(`null and undefined values produce TypeErrors`, () => {
			expect(safeIntegerError({ argKey:`count`, value:null }).constructor).toBe(TypeError);
			expect(safeIntegerError({ argKey:`count`, value:undefined }).constructor).toBe(TypeError);
		});

		test(`a bigint value produces a TypeError (typeof is not "number")`, () => {
			expect(safeIntegerError({ argKey:`count`, value:9n }).constructor).toBe(TypeError);
			expect(safeIntegerError({ argKey:`count`, min:1, max:5, value:9n }).constructor).toBe(TypeError);
		});

		test(`a numeric string produces a TypeError`, () => {
			expect(safeIntegerError({ argKey:`count`, value:"9n" }).constructor).toBe(TypeError);
			expect(safeIntegerError({ argKey:`count`, min:1, max:5, value:"9n" }).constructor).toBe(TypeError);
		});

		test(`min/max bounds do not change TypeError selection for null`, () => {
			expect(safeIntegerError({ argKey:`count`, min:1, max:5, value:null }).constructor).toBe(TypeError);
		});

	});

	describe("mustBe message", () => {

		test(`with both min and max the message describes an inclusive range`, () => {
			const error = safeIntegerError({ argKey:`count`, min:1, max:5, value:9 });
			expect(error.message).toBe(`The "count" argument must be a safe integer between 1 and 5 (inclusive). Received 9`);
		});

		test(`with only max the message describes an upper bound`, () => {
			const error = safeIntegerError({ argKey:`count`, max:5, value:9 });
			expect(error.message).toBe(`The "count" argument must be a safe integer less than or equal to 5. Received 9`);
		});

		test(`with only min the message describes a lower bound`, () => {
			const error = safeIntegerError({ argKey:`count`, min:1, value:9 });
			expect(error.message).toBe(`The "count" argument must be a safe integer greater than or equal to 1. Received 9`);
		});

		test(`with neither bound the message is just "a safe integer"`, () => {
			const error = safeIntegerError({ argKey:`count`, value:9 });
			expect(error.message).toBe(`The "count" argument must be a safe integer. Received 9`);
		});

		test(`TypeError messages describe the received type, not just the value`, () => {
			const error = safeIntegerError({ argKey:`count`, min:1, max:5, value:null });
			expect(error.message).toBe(`The "count" argument must be a safe integer between 1 and 5 (inclusive). Received null`);
		});

	});

	describe("stack", () => {

		test(`the stack does not include the safeIntegerError frame itself`, () => {
			const error = safeIntegerError({ argKey:`count`, value:9 });
			expect(error.stack).not.toContain(`at safeIntegerError (`);
		});

	});

});
