import type { DialogOptions } from "./DialogOptions.js";
import type { DiceOptions } from "./DiceOptions.js";
import type { GameSystemOptions } from "./GameSystemOptions.js";

export type GameOptions = DialogOptions & DiceOptions & GameSystemOptions & {
	name: string;
};