import { toSuperscript } from "../internal/toSuperscript.js";

export function markAsBelowThreshold(value: number, threshold: number | string, isFixed?: boolean): string {
	const superF = isFixed ? "ᶠ" : "";
	return `${threshold}↥${toSuperscript(value)}${superF}`;
}