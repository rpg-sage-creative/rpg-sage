import { describe, expect, test } from "vitest";
import { rangeError } from "../build/index.js";

describe("rangeError", () => {

	test(`creates a RangeError`, () => {
		expect(rangeError({ argKey:`count`, mustBe:`a safe integer greater than 0`, value:9 })).toBeInstanceOf(RangeError);
	});

	test(`the message includes the trimmed mustBe description and received number`, () => {
		const error = rangeError({ argKey:`count`, mustBe:` > 0 `, value:9 });
		expect(error.message).toBe(`The "count" argument must be > 0. Received 9`);
	});

	test(`string values are quoted in the received portion`, () => {
		const error = rangeError({ argKey:`name`, mustBe:`a string`, value:`abc` });
		expect(error.message).toBe(`The "name" argument must be a string. Received 'abc'`);
	});

	test(`non-string values are interpolated as-is`, () => {
		expect(rangeError({ argKey:`v`, mustBe:`x`, value:null }).message).toContain(`Received null`);
		expect(rangeError({ argKey:`v`, mustBe:`x`, value:undefined }).message).toContain(`Received undefined`);
		expect(rangeError({ argKey:`v`, mustBe:`x`, value:true }).message).toContain(`Received true`);
	});

	test(`the stack does not include the rangeError frame itself`, () => {
		const error = rangeError({ argKey:`v`, mustBe:`x`, value:1 });
		expect(error.stack).not.toContain(`at rangeError (`);
	});

});
