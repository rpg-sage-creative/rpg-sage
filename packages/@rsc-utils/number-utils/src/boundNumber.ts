import { isFiniteNumber } from "@rsc-utils/type-utils";
import type { Optional } from "@rsc-utils/type-utils";

export type BoundedOptions = {
	min?: number;
	max?: number;
	default?: number;
};

/**
 * If the value is not finite (NaN/±Infinity) or is outside the bounds, the default value is returned.
 * Non-finite bounds are ignored; omit min/max to leave a side unbounded.
 */
export function boundNumber(value: Optional<number>, options: BoundedOptions & { default:number; }): number;

/**
 * If the value is not finite (NaN/±Infinity) or is outside the bounds, the default value is returned.
 * Non-finite bounds are ignored; omit min/max to leave a side unbounded.
 */
export function boundNumber(value: Optional<number>, options: BoundedOptions): number | undefined;

export function boundNumber(value: Optional<number>, options: BoundedOptions): number | undefined {
	if (!isFiniteNumber(value)) return options.default;
	if (isFiniteNumber(options.min) && value < options.min) return options.default;
	if (isFiniteNumber(options.max) && value > options.max) return options.default;
	return value;
}
