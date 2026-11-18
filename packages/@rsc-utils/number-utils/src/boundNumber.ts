import { isFiniteNumber } from "@rsc-utils/type-utils";
import type { Optional } from "@rsc-utils/type-utils";

export type BoundedOptions = {
	/** the minimum value allowed */
	min?: number;
	/** the number to return if the value is less than min (instead of min) */
	minDefault?: number;
	/** the maximum value allowed */
	max?: number;
	/** the number to return if the value is greater than max (instead of max) */
	maxDefault?: number;
	/** the number to return if the value isn't a finite number or if minDefault/maxDefault are needed but not given */
	default?: number;
};

/**
 * If the value isn't a number (or NaN), the default value is returned.
 * If a finite min/max is given, and the number is outside the bounds, an appropriate boundary or default is returned.
 * If the value is infinite and no min/max is given, the default value is returned.
 */
export function boundNumber(value: Optional<number>, options: BoundedOptions & { default:number; }): number;

/**
 * If the value isn't a number (or NaN), the default value is returned.
 * If a finite min/max is given, and the number is outside the bounds, an appropriate boundary or default is returned.
 * If the value is infinite and no min/max is given, the default value is returned.
 * It is possible to return undefined if the value isn't finite and no bounds or defaults are given.
 */
export function boundNumber(value: Optional<number>, options: BoundedOptions): number | undefined;

export function boundNumber(value: Optional<number>, options: BoundedOptions): number | undefined {
	// invalid number gets default (or undefined)
	if (typeof(value) !== "number" || Number.isNaN(value)) {
		return options.default;
	}

	// less than min gets minDefault, default, or min
	if (isFiniteNumber(options.min) && value < options.min) {
		return options.minDefault ?? options.default ?? options.min;
	}

	// greater than max gets maxDefault, default, or max
	if (isFiniteNumber(options.max) && value > options.max) {
		return options.maxDefault ?? options.default ?? options.max;
	}

	// check ±Infinity after min/max to ensure we clamp correctly before returning default
	if (value === -Infinity || value === Infinity) {
		return options.default;
	}

	// return valid bound number
	return value;
}
