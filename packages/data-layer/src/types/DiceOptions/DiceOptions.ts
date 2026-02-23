import type { Snowflake } from "@rsc-utils/core-utils";
import type { DiceCriticalMethodType, DiceOutputType, DicePostType, DiceSecretMethodType, DiceSortType } from "../enums/index.js";

export type DiceOptionsOld = DiceOptionsV0;
export type DiceOptions = DiceOptionsV1;
export type DiceOptionsAny = DiceOptionsOld | DiceOptions;

export type DiceOptionsV0 = DiceOptionsV1 & {
	/** @deprecated */
	defaultCritMethodType?: number;
	/** @deprecated */
	defaultDiceOutputType?: number;
	/** @deprecated */
	defaultDicePostType?: number;
	/** @deprecated */
	defaultDiceSecretMethodType?: number;
};

export type DiceOptionsV1 = {
	diceCritMethodType: DiceCriticalMethodType;
	diceOutputType: DiceOutputType;
	dicePostType: DicePostType;
	diceSecretMethodType: DiceSecretMethodType;
	diceSortType: DiceSortType;
	sendDiceTo: Snowflake;
};