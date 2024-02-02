import type { DiceDropKeep } from "../DiceDropKeep.js";

/**
 * @internal
 */
export type DicePart = {
	dropKeep: DiceDropKeep;
	fixedRolls?: number[];
	sides: number;
};