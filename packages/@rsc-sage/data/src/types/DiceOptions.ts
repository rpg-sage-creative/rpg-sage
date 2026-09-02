import type { Snowflake } from "@rsc-utils/core-utils";
import { isNonNilSnowflake } from "@rsc-utils/core-utils";
import { assertNumber, assertString, optional, renameProperty } from "../validation/index.js";
import { DiceCriticalMethodType, DiceOutputType, DicePostType, DiceSecretMethodType, DiceSortType } from "./enums/index.js";

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

/** diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, diceSortType, sendDiceTo */
export function assertDiceOptions({ core, objectType }: { core:DiceOptionsAny; objectType:string; }): boolean {

	if (!assertNumber({ core, objectType, key:"diceCritMethodType", optional, validator:DiceCriticalMethodType })) return false;
	if (!assertNumber({ core, objectType, key:"diceOutputType", optional, validator:DiceOutputType })) return false;
	if (!assertNumber({ core, objectType, key:"dicePostType", optional, validator:DicePostType })) return false;
	if (!assertNumber({ core, objectType, key:"diceSecretMethodType", optional, validator:DiceSecretMethodType })) return false;
	if (!assertNumber({ core, objectType, key:"diceSortType", optional, validator:DiceSortType })) return false;
	if (!assertString({ core, objectType, key:"sendDiceTo", optional, validator:isNonNilSnowflake })) return false;

	return true;
}

export function ensureDiceOptions(core: DiceOptionsOld): DiceOptions {

	renameProperty({ core, oldKey:"defaultCritMethodType", newKey:"diceCritMethodType" });
	renameProperty({ core, oldKey:"defaultDiceOutput", newKey:"diceOutputType" });
	renameProperty({ core, oldKey:"defaultDiceOutputType", newKey:"diceOutputType" });
	renameProperty({ core, oldKey:"defaultDicePostType", newKey:"dicePostType" });
	renameProperty({ core, oldKey:"defaultDiceSecretMethodType", newKey:"diceSecretMethodType" });

	return core;
}
