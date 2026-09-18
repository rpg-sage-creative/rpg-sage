import { rangeError } from "./rangeError.js";
import { typeError } from "./typeError.js";

type Args = {
	argKey: string;
	max: number;
	min: number;
	value: unknown;
} | {
	argKey: string;
	max: number;
	min?: never;
	value: unknown;
} | {
	argKey: string;
	max?: never;
	min: number;
	value: unknown;
};

/**
 * Creates either a RangeError or TypeError based on the min, max, and value args given.
 */
export function safeIntegerError(args: Args): TypeError | RangeError {
	const { argKey, max, min, value } = args;

	const hasMax = typeof(max) === "number";
	const hasMin = typeof(min) === "number";

	let mustBe: string;

	if (hasMax && hasMin) {
		mustBe = `a safe integer between ${min} and ${max} (inclusive)`;

	}else if (hasMax) {
		mustBe = `a safe integer less than or equal to ${max}`;

	}else if (hasMin) {
		mustBe = `a safe integer greater than or equal to ${min}`;

	}else {
		mustBe = "a safe integer";

	}

	const error = typeof(value) === "number"
		? rangeError({ argKey, mustBe, value })
		: typeError({ argKey, mustBe, value });
	Error.captureStackTrace(error, safeIntegerError);
	return error;
}