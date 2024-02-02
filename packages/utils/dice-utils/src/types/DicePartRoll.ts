import type { DicePart } from "./DicePart.js";

/**
 * @internal
 */
export type DicePartRoll = {
	dice: DicePart;
	rolls: number[];
};