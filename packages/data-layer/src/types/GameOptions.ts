import { isNotBlank } from "@rsc-utils/core-utils";
import { assertString } from "../validation/index.js";
import { assertDialogOptions, DialogOptionsKeys, ensureDialogOptions, type DialogOptions, type DialogOptionsOld } from "./DialogOptions.js";
import { assertDiceOptions, DiceOptionsKeys, ensureDiceOptions, type DiceOptions, type DiceOptionsOld } from "./DiceOptions.js";
import { assertGameSystemOptions, ensureGameSystemOptions, GameSystemOptionsKeys, type GameSystemOptions, type GameSystemOptionsOld } from "./GameSystemOptions.js";

export type GameOptionsOld = GameOptions & DiceOptionsOld & DialogOptionsOld & GameSystemOptionsOld;

export type GameOptions = DialogOptions & DiceOptions & GameSystemOptions & {
	name: string;
};

export const GameOptionsKeys: (keyof GameOptions)[] = [
	...DialogOptionsKeys,
	...DiceOptionsKeys,
	...GameSystemOptionsKeys,
	"name",
];

/**
 * assertDialogOptions: dialogPostType, gmCharacterName, mentionPrefix, moveDirectionOutputType, sendDialogTo;
 * assertDiceOptions: diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, diceSortType, sendDiceTo;
 * assertGameSystemOptions: gameSystemType
 */
export function assertGameOptions({ core, objectType }: { core:GameOptions; objectType:string; }): boolean {
	// dialogPostType, gmCharacterName, mentionPrefix, moveDirectionOutputType, sendDialogTo
	if (!assertDialogOptions({ core, objectType })) return false;

	// diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, diceSortType, sendDiceTo
	if (!assertDiceOptions({ core, objectType })) return false;

	// gameSystemType
	if (!assertGameSystemOptions({ core, objectType })) return false;

	if (!assertString({ core, objectType, key:"name", validator:isNotBlank })) return false;

	return true;
}

/**
 * ensureDialogOptions: dialogPostType, gmCharacterName, mentionPrefix, moveDirectionOutputType, sendDialogTo;
 * ensureDiceOptions: diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, diceSortType, sendDiceTo;
 * ensureGameSystemOptions: gameSystemType
 */
export function ensureGameOptions(core: GameOptionsOld): GameOptions {
	ensureDialogOptions(core);
	ensureDiceOptions(core);
	ensureGameSystemOptions(core);
	return core;
}