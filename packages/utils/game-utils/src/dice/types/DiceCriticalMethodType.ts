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
		if (/x2|times[ -]?two/i.test(value)) {
			return DiceCriticalMethodType.TimesTwo;
		}
		if (/(roll[ -]?)?twice/i.test(value)) {
			return DiceCriticalMethodType.RollTwice;
		}
		if (/add[ -]?max/i.test(value)) {
			return DiceCriticalMethodType.AddMax;
		}
	}
	return undefined;
}
