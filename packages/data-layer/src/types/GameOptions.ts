import { DialogOptionsKeys, type DialogOptions } from "./DialogOptions.js";
import { DiceOptionsKeys, type DiceOptions } from "./DiceOptions/index.js";
import { GameSystemOptionsKeys, type GameSystemOptions } from "./GameSystemOptions.js";

export type GameOptions = DialogOptions & DiceOptions & GameSystemOptions & {
	name: string;
};

export const GameOptionsKeys: (keyof GameOptions)[] = [
	...DialogOptionsKeys,
	...DiceOptionsKeys,
	...GameSystemOptionsKeys,
	"name",
];