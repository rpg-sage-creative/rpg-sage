import { DialogOptionsKeys, DiceOptionsKeys, GameSystemOptionsKeys, type DialogOptions, type DiceOptions, type GameSystemOptions } from "../index.js";

export type GameOptions = DialogOptions & DiceOptions & GameSystemOptions & {
	name: string;
};

export const GameOptionsKeys: (keyof GameOptions)[] = [
	...DialogOptionsKeys,
	...DiceOptionsKeys,
	...GameSystemOptionsKeys,
	"name",
];