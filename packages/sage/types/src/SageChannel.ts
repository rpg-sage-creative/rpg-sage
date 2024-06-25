import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import type { DialogPostType } from "./DialogPostType.js";
import type { DiceCritMethodType } from "./DiceCritMethodType.js";
import type { DiceOutputType } from "./DiceOutputType.js";
import type { DicePostType } from "./DicePostType.js";
import type { DiceSecretMethodType } from "./DiceSecretMethodType.js";
import type { GameSystemType } from "./GameSystem.js";

export type DialogOptions = {
	dialogPostType: DialogPostType;
	gmCharacterName: string;
	sendDialogTo: Snowflake;
};

export type DiceOptions = {
	diceCritMethodType: DiceCritMethodType;
	diceOutputType: DiceOutputType;
	dicePostType: DicePostType;
	diceSecretMethodType: DiceSecretMethodType;
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

export function parseSageChannelType(value: Optional<string>): SageChannelType | undefined {
	if (value) {
		if (/\b(gm|game[ -]?master)s?\b/i.test(value)) {
			return SageChannelType.GameMaster;
		}
		if (/\b(ic|in[ -]?char(acter)?)\b/i.test(value)) {
			return SageChannelType.InCharacter;
		}
		if (/\b(ooc|out[ -]?of[ -]?char(acter)?)\b/i.test(value)) {
			return SageChannelType.OutOfCharacter;
		}
		if (/\bmisc(ellaneous)?\b/i.test(value)) {
			return SageChannelType.Miscellaneous;
		}
		if (/\bdice\b/i.test(value)) {
			return SageChannelType.Dice;
		}
		if (/\bnone\b/i.test(value)) {
			return SageChannelType.None;
		}
	}
	return undefined;
}
