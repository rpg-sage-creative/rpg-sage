import type { Optional } from "@rsc-utils/core-utils";

export enum DiceCriticalMethodType {

	/** Not set, use default if one exists. */
	Unknown = 0,

	/** Multiple the total x 2. */
	TimesTwo = 1,

	/** Roll the dice twice and add them together. */
	RollTwice = 2,

	/** Roll the dice once and add that to the max possible result. */
	AddMax = 3
}

export function parseDiceCriticalMethodType(value: Optional<string>): DiceCriticalMethodType | undefined {
	if (value) {
		const lower = value.toLowerCase();
		if (lower.includes("x2") || lower.includes("timestwo") || lower.includes("times-two") || lower.includes("times two")) {
			return DiceCriticalMethodType.TimesTwo;
		}
		if (lower.includes("twice") || lower.includes("rolltwice") || lower.includes("roll-twice") || lower.includes("roll twice")) {
			return DiceCriticalMethodType.RollTwice;
		}
		if (lower.includes("addmax") || lower.includes("add-max") || lower.includes("add max")) {
			return DiceCriticalMethodType.AddMax;
		}
	}
	return undefined;
}
