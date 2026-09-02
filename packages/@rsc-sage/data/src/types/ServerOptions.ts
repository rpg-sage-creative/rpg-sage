import { assertDialogOptions, DialogOptionsKeys, ensureDialogOptions, type DialogOptions, type DialogOptionsOld } from "./DialogOptions.js";
import { assertDiceOptions, DiceOptionsKeys, ensureDiceOptions, type DiceOptions, type DiceOptionsOld } from "./DiceOptions.js";
import { assertGameSystemOptions, ensureGameSystemOptions, GameSystemOptionsKeys, type GameSystemOptions, type GameSystemOptionsOld } from "./GameSystemOptions.js";

export type ServerOptionsOld = ServerOptions & DiceOptionsOld & DialogOptionsOld & GameSystemOptionsOld;

export type ServerOptions = DialogOptions & DiceOptions & GameSystemOptions;

export const ServerOptionsKeys: (keyof ServerOptions)[] = [
	...DialogOptionsKeys,
	...DiceOptionsKeys,
	...GameSystemOptionsKeys,
];

/**
 * assertDialogOptions: dialogPostType, gmCharacterName, mentionPrefix, moveDirectionOutputType, sendDialogTo;
 * assertDiceOptions: diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, diceSortType, sendDiceTo;
 * assertGameSystemOptions: gameSystemType
 */
export function assertServerOptions({ core, objectType }: { core:ServerOptions; objectType:string; }): boolean {
	// dialogPostType, gmCharacterName, mentionPrefix, moveDirectionOutputType, sendDialogTo
	if (!assertDialogOptions({ core, objectType })) return false;

	// diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, diceSortType, sendDiceTo
	if (!assertDiceOptions({ core, objectType })) return false;

	// gameSystemType
	if (!assertGameSystemOptions({ core, objectType })) return false;

	return true;
}

/**
 * ensureDialogOptions: dialogPostType, gmCharacterName, mentionPrefix, moveDirectionOutputType, sendDialogTo;
 * ensureDiceOptions: diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, diceSortType, sendDiceTo;
 * ensureGameSystemOptions: gameSystemType
 */
export function ensureServerOptions(core: ServerOptionsOld): ServerOptions {
	ensureDialogOptions(core);
	ensureDiceOptions(core);
	ensureGameSystemOptions(core);
	return core;
}