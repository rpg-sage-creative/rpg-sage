import { toSuperscript } from "../internal/toSuperscript.js";

export function markAsAboveThreshold(value: number, threshold: number | string, isFixed?: boolean): string {
	const superF = isFixed ? "ᶠ" : "";
	return `${threshold}↧${toSuperscript(value)}${superF}`;
}