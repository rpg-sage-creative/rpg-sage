import type { Optional, TypedRegExp } from "@rsc-utils/type-utils";
import { regex } from "regex";
import { Arg } from "./Arg.js";
import { AlphaNumericDashDotArgKeyRegExp } from "./regexp.js";
import type { FlagArg } from "./types.js";

type FlagArgMatchGroups = {
	key: string;
};

export const FlagArgRegExp = regex()`
	(
		-{1,2}
		|
		\u2014 # MDASH; iOS apparently has an autocorrect feature that converts two dashes to an MDASH
	)
	(?<key> ${AlphaNumericDashDotArgKeyRegExp} )
` as TypedRegExp<FlagArgMatchGroups>;

// export const FlagArgRegExpG = globalizeRegex(FlagArgRegExp);

export function parseFlagArg<KeyType extends string = string>(raw: Optional<string>, index?: number): FlagArg<KeyType> | undefined;
export function parseFlagArg(raw: Optional<string>, index?: number): FlagArg | undefined {
	if (raw) {
		const match = FlagArgRegExp.exec(raw);
		if (match?.index === 0 && match[0].length === raw.length) {
			return Arg.from({
				index,
				isFlag: true,
				key: match.groups.key,
				// value: raw,
				raw,
			});
		}
	}
	return undefined;
}