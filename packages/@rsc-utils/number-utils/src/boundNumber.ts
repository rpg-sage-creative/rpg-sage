import type { Optional } from "@rsc-utils/type-utils";

export type BoundedOptions = {
	min?: number;
	max?: number;
	default?: number;
};

/** If the value is outside the bounds, the default value is returned. */
export function boundNumber(value: Optional<number>, options: BoundedOptions & { default:number; }): number;

/** If the value is outside the bounds, the default value (or undefined if no default is given) is returned. */
export function boundNumber(value: Optional<number>, options: BoundedOptions): number | undefined;

export function boundNumber(value: Optional<number>, options: BoundedOptions): number | undefined {
	if (typeof(value) !== "number" || isNaN(value)) return options.default;
	if (options.min !== undefined && value < options.min) return options.default;
	if (options.max !== undefined && value > options.max) return options.default;
	return value;
}
