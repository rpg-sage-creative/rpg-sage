import type { TypedRegExp } from "@rsc-utils/core-utils";
import { regex } from "regex";

type KeepSpecifier = `${"k"|"K"}${"l"|"L"|"h"|"H"}`;
type FortuneSign = "+" | "-";

export type DiceMacroPrefix = {
	prefixLength: number;
	rollCount: number;
	fortuneSign?: never;
	keep?: never;
} | {
	prefixLength: number;
	rollCount?: never;
	fortuneSign: FortuneSign;
	keep?: never;
} | {
	prefixLength: number;
	rollCount?: never;
	fortuneSign?: never;
	keep: {
		diceCount?: number;
		/** "kh" | "kl" */
		specifier?: KeepSpecifier;
		keepCount?: number;
	};
};

type ParsePrefixRegExpGroups = {
	dirtyPrefix: string;
	rollCount: `${number}`;
	keepDiceCount?: never;
	keepSpecifier?: never;
	keepKeepCount?: never;
	fortuneSign?: never;
} | {
	dirtyPrefix: string;
	rollCount?: never;
	keepDiceCount?: `${number}`;
	keepSpecifier: KeepSpecifier;
	keepKeepCount?: `${number}`;
	fortuneSign?: never;
} | {
	dirtyPrefix: string;
	rollCount?: never;
	keepDiceCount?: never;
	keepSpecifier?: never;
	keepKeepCount?: never;
	fortuneSign: FortuneSign;
};

const ParsePrefixRegExp = regex("i")`
	^ # only valid at start of string

	(?<dirtyPrefix>

		# number of times to roll
		(?<rollCount>
			\d*        # roll count
		)
		\#

		|

		# number of rolls w/ keep high/low
		(
			(?<keepDiceCount>
				\d*    # roll count
			)
			(?<keepSpecifier>
				k[hl]  # keep high/low specifier
			)
			(?<keepKeepCount>
				\d*    # roll count
			)
		)
		\#

		|

		# advantage/disadvantage or fortune/misfortune
		(?<fortuneSign>
			[\+\-]
		)

	)
` as TypedRegExp<ParsePrefixRegExpGroups>;

/**
 * Parses macro prefix info from the given macro string.
 * If no prefix info is found, then a prefixLength of 0 and a rollCount of 1 are the defaults
 */
export function parseDiceMacroPrefix(input: string): DiceMacroPrefix | undefined {
	const match = ParsePrefixRegExp.exec(input)
	if (!match) return undefined;

	const { dirtyPrefix, rollCount, keepDiceCount, keepSpecifier, keepKeepCount, fortuneSign } = match.groups;
	const prefixLength = dirtyPrefix.length;

	if (keepSpecifier) {
		return {
			prefixLength,
			keep:{
				diceCount: keepDiceCount ? +keepDiceCount : undefined,
				specifier: keepSpecifier,
				keepCount: keepKeepCount ? +keepKeepCount : undefined
			}
		};
	}

	if (fortuneSign) {
		return { prefixLength, fortuneSign };
	}

	if (rollCount) {
		return { prefixLength, rollCount: +rollCount };
	}

	// this should never be returned
	return undefined;
}