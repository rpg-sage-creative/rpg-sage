import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import type { GameSystemType } from "@rsc-utils/game-utils";
import type { DialogPostType } from "./DialogPostType.js";
import type { DiceCritMethodType } from "./DiceCritMethodType.js";
import type { DiceOutputType } from "./DiceOutputType.js";
import type { DicePostType } from "./DicePostType.js";
import type { DiceSecretMethodType } from "./DiceSecretMethodType.js";
import type { DiceSortType } from "./DiceSortType.js";

export type DialogOptions = {
	dialogPostType: DialogPostType;
	gmCharacterName: string;
	mentionPrefix?: string;
	moveDirectionOutputType?: number;
	sendDialogTo: Snowflake;
};

export type DiceOptions = {
	diceCritMethodType: DiceCritMethodType;
	diceOutputType: DiceOutputType;
	dicePostType: DicePostType;
	diceSecretMethodType: DiceSecretMethodType;
	diceSortType: DiceSortType;
	sendDiceTo: Snowflake;
};

export type SystemOptions = {
	gameSystemType: GameSystemType;
};

export type ChannelOptions = {
	type: SageChannelType;
}

export type SageChannelOptions = DialogOptions & DiceOptions & SystemOptions & ChannelOptions;

export type SageChannel = Partial<SageChannelOptions> & {
	/** @deprecated */
	did?: Snowflake;
	id: Snowflake;
};


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
