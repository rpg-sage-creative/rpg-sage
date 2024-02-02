import { markAsFixed, markAsMax, markAsMin } from "../markup.js";
import type { RollData } from "../types/RollData.js";

/** Creates the RollData used to markup die roll output. */
export function rollDataMapper(roll: number, index: number, sides: number, isFixed: boolean): RollData {
	let output = String(roll);

	if (isFixed) {
		output = markAsFixed(output);
	}

	const isMax = roll === sides;
	if (isMax) {
		output = markAsMax(output);
	}

	const isMin = roll === 1;
	if (isMin) {
		output = markAsMin(output);
	}

	return { index, isFixed, isMax, isMin, output, roll };
}
