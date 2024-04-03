import type { DialogOptions, DiceOptions, SystemOptions } from "./SageChannel.js";

export type GameOptions = SystemOptions & DiceOptions & DialogOptions & {
	name: string;
};