import { toSuperscript } from "@rsc-utils/number-utils";

export function markAsAboveThreshold(value: number, threshold: number | string, isFixed?: boolean): string {
	const superF = isFixed ? "ᶠ" : "";
	return `${threshold}↧${toSuperscript(value)}${superF}`;
}