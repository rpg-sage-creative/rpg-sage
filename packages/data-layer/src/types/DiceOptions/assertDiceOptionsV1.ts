import { isNonNilSnowflake } from "@rsc-utils/core-utils";
import { assertNumber, assertString, optional } from "../../validation/index.js";
import { DiceCriticalMethodType, DiceOutputType, DicePostType, DiceSecretMethodType, DiceSortType } from "../enums/index.js";
import type { DiceOptionsAny, DiceOptionsV1 } from "./DiceOptions.js";

/** diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, diceSortType, sendDiceTo */
export function assertDiceOptionsV1(objectType: string, core: DiceOptionsAny): core is DiceOptionsV1 {

	if (!assertNumber({ core, objectType, key:"diceCritMethodType", optional, validator:DiceCriticalMethodType })) return false;
	if (!assertNumber({ core, objectType, key:"diceOutputType", optional, validator:DiceOutputType })) return false;
	if (!assertNumber({ core, objectType, key:"dicePostType", optional, validator:DicePostType })) return false;
	if (!assertNumber({ core, objectType, key:"diceSecretMethodType", optional, validator:DiceSecretMethodType })) return false;
	if (!assertNumber({ core, objectType, key:"diceSortType", optional, validator:DiceSortType })) return false;
	if (!assertString({ core, objectType, key:"sendDiceTo", optional, validator:isNonNilSnowflake })) return false;

	return true;
}