import type { Optional } from "@rsc-utils/core-utils";
import { DiceCriticalMethodType } from "@rsc-utils/game-utils";
export { DiceCriticalMethodType as DiceCritMethodType } from "@rsc-utils/game-utils";
export function parseDiceCritMethodType(value: Optional<string>): DiceCriticalMethodType | undefined {
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
