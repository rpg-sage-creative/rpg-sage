import type { Optional } from "@rsc-utils/core-utils";

export enum SageChannelType {
	None = 0,
	InCharacter = 1,
	OutOfCharacter = 2,
	GameMaster = 3,
	Miscellaneous = 4,
	Dice = 5
}

const GameMasterRegExp = /\b(gm|game[ -]?master)s?\b/i;
const InCharacterRegExp = /\b(ic|in[ -]?char(acter)?)\b/i;
const OutOfCharacterRegExp = /\b(ooc|out[ -]?of[ -]?char(acter)?)\b/i;
const MiscellaneousRegExp = /\bmisc(ellaneous)?\b/i;
const DiceRegExp = /\bdice\b/i;
const NoneRegExp = /\bnone\b/i;

export function parseSageChannelType(value: Optional<string>): SageChannelType | undefined {
	if (value) {
		if (GameMasterRegExp.test(value)) {
			return SageChannelType.GameMaster;
		}
		if (InCharacterRegExp.test(value)) {
			return SageChannelType.InCharacter;
		}
		if (OutOfCharacterRegExp.test(value)) {
			return SageChannelType.OutOfCharacter;
		}
		if (MiscellaneousRegExp.test(value)) {
			return SageChannelType.Miscellaneous;
		}
		if (DiceRegExp.test(value)) {
			return SageChannelType.Dice;
		}
		if (NoneRegExp.test(value)) {
			return SageChannelType.None;
		}
	}
	return undefined;
}
