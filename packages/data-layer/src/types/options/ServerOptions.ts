import { DialogOptionsV1Keys, DiceOptionsV1Keys, GameSystemOptionsV1Keys, type DialogOptions, type DiceOptions, type GameSystemOptions } from "../../index.js";

export type ServerOptions = DialogOptions & DiceOptions & GameSystemOptions;

export const ServerOptionsKeysV1: (keyof ServerOptions)[] = [
	...DialogOptionsV1Keys,
	...DiceOptionsV1Keys,
	...GameSystemOptionsV1Keys,
];