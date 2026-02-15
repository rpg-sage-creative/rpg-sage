import type { Snowflake } from "@rsc-utils/core-utils";
import type { DiceCriticalMethodType, DiceSecretMethodType } from "@rsc-utils/game-utils";
import type { DiceOutputType } from "../enums/DiceOutputType.js";
import type { DicePostType } from "../enums/DicePostType.js";
import type { DiceSortType } from "../enums/DiceSortType.js";

export type DiceOptions = {
	diceCritMethodType: DiceCriticalMethodType;
	diceOutputType: DiceOutputType;
	dicePostType: DicePostType;
	diceSecretMethodType: DiceSecretMethodType;
	diceSortType: DiceSortType;
	sendDiceTo: Snowflake;
};