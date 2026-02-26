import type { Snowflake } from "@rsc-utils/core-utils";
import type { DiceCriticalMethodType, DiceOutputType, DicePostType, DiceSecretMethodType, DiceSortType } from "../enums/index.js";

export type DiceOptionsAny = DiceOptionsOld | DiceOptions;

export type DiceOptionsOld = DiceOptions & {
	/** @deprecated */
	defaultCritMethodType?: DiceCriticalMethodType;
	/** @deprecated */
	defaultDiceOutput?: DiceOutputType;
	/** @deprecated */
	defaultDiceOutputType?: DiceOutputType;
	/** @deprecated */
	defaultDicePostType?: DicePostType;
	/** @deprecated */
	defaultDiceSecretMethodType?: DiceSecretMethodType;
};

export type DiceOptions = {
	diceCritMethodType?: DiceCriticalMethodType;
	diceOutputType?: DiceOutputType;
	dicePostType?: DicePostType;
	diceSecretMethodType?: DiceSecretMethodType;
	diceSortType?: DiceSortType;
	sendDiceTo?: Snowflake;
};

export const DiceOptionsKeys: (keyof DiceOptions)[] = [
	"diceCritMethodType",
	"diceOutputType",
	"dicePostType",
	"diceSecretMethodType",
	"diceSortType",
	"sendDiceTo",
];