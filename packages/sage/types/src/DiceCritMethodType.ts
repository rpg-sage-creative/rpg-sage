import type { Optional } from "@rsc-utils/type-utils";

export enum DiceCritMethodType {
	Unknown = 0,
	TimesTwo = 1,
	RollTwice = 2,
	AddMax = 3
}

export function parseDiceCritMethodType(value: Optional<string>): DiceCritMethodType | undefined {
	if (value) {
		if (/x2|times[ -]?two/i.test(value)) {
			return DiceCritMethodType.TimesTwo;
		}
		if (/(roll[ -]?)?twice/i.test(value)) {
			return DiceCritMethodType.RollTwice;
		}
		if (/add[ -]?max/i.test(value)) {
			return DiceCritMethodType.AddMax;
		}
	}
	return undefined;
}
