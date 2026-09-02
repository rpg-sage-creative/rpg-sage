import type { Optional } from "@rsc-utils/core-utils";

export type BoundedOptions = {
	min: number;
	max: number;
	default: number;
};

export function boundNumber(value: Optional<number>, options: BoundedOptions): number {
	if (typeof(value) !== "number" || isNaN(value)) return options.default;
	if (value < options.min || value > options.max) return options.default;
	return value;
}