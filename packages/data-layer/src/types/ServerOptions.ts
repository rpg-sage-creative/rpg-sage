import { DialogOptionsKeys, type DialogOptions } from "./DialogOptions.js";
import { DiceOptionsKeys, type DiceOptions } from "./DiceOptions/index.js";
import { GameSystemOptionsKeys, type GameSystemOptions } from "./GameSystemOptions.js";

export type ServerOptions = DialogOptions & DiceOptions & GameSystemOptions;

export const ServerOptionsKeys: (keyof ServerOptions)[] = [
	...DialogOptionsKeys,
	...DiceOptionsKeys,
	...GameSystemOptionsKeys,
];