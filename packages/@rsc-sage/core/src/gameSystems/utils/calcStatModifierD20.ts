import type { Optional } from "@rsc-utils/type-utils";

export function calcStatModifierD20(value: Optional<number>): number {
	if (!value) return 0;
	return Math.floor((value - 10) / 2);
}