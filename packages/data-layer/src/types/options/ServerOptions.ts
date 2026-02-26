import { DialogOptionsKeys, DiceOptionsKeys, GameSystemOptionsKeys, type DialogOptions, type DiceOptions, type GameSystemOptions } from "../../index.js";

export type ServerOptions = DialogOptions & DiceOptions & GameSystemOptions;

export const ServerOptionsKeysV1: (keyof ServerOptions)[] = [
	...DialogOptionsKeys,
	...DiceOptionsKeys,
	...GameSystemOptionsKeys,
];