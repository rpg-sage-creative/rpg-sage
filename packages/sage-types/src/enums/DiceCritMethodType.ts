import type { Optional } from "@rsc-utils/core-utils";
import { DiceCriticalMethodType } from "@rsc-utils/game-utils";

export { DiceCriticalMethodType as DiceCritMethodType } from "@rsc-utils/game-utils";

const TimesTwoRegExp = /\b(x2|times[ -]?two)\b/i;
const RollTwiceRegExp = /\b(roll[ -]?)?twice\b/i;
const AddMaxRegExp = /\badd[ -]?max\b/i;

export function parseDiceCritMethodType(value: Optional<string>): DiceCriticalMethodType | undefined {
	if (value) {
		if (TimesTwoRegExp.test(value)) {
			return DiceCriticalMethodType.TimesTwo;
		}
		if (RollTwiceRegExp.test(value)) {
			return DiceCriticalMethodType.RollTwice;
		}
		if (AddMaxRegExp.test(value)) {
			return DiceCriticalMethodType.AddMax;
		}
	}
	return undefined;
}
