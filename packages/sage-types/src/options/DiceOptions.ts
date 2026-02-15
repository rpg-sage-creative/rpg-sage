import type { Snowflake } from "@rsc-utils/core-utils";
import type { DiceCritMethodType } from "../enums/DiceCritMethodType.js";
import type { DiceOutputType } from "../enums/DiceOutputType.js";
import type { DicePostType } from "../enums/DicePostType.js";
import type { DiceSecretMethodType } from "../enums/DiceSecretMethodType.js";
import type { DiceSortType } from "../enums/DiceSortType.js";

export type DiceOptions = {
	diceCritMethodType: DiceCritMethodType;
	diceOutputType: DiceOutputType;
	dicePostType: DicePostType;
	diceSecretMethodType: DiceSecretMethodType;
	diceSortType: DiceSortType;
	sendDiceTo: Snowflake;
};