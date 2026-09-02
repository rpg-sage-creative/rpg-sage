import type { RollData } from "../types/RollData.js";

/** @internal Creates the RollData used to markup die roll output. */
export function rollDataMapper(roll: number, index: number, dieSize: number, isFixed: boolean): RollData {
	return {
		dieSize,
		index,
		initialValue: roll,
		isFixed: isFixed ? true : undefined,
		isMax: roll === dieSize ? true : undefined,
		isMin: roll === 1 ? true : undefined,
		text: String(roll),
		value: roll
	};
}
