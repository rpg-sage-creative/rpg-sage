import type { RollData } from "../types/RollData.js";
import { numberSorter } from "./numberSorter.js";

/** @internal */
export function rollDataSorter(a: RollData, b: RollData): -1 | 0 | 1 {
	// The first sort of .roll sorts the rolls in ascending order by roll value.
	const rollResult = numberSorter(a?.threshold ?? a?.value, b?.threshold ?? b?.value);
	if (rollResult !== 0) {
		return rollResult;
	}

	// The second sort of .index ensures that the first of two equal rolls is on the left so that we properly strike them in order.
	const indexResult = numberSorter(a?.index, b?.index);
	if (indexResult !== 0) {
		return indexResult;
	}

	return 0;
}