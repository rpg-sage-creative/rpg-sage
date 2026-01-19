import { sum } from "@rsc-utils/core-utils";
import type { TDicePart } from "../dice/DicePart.js";
import { rollDataMapper } from "../internal/rollDataMapper.js";
import { rollDataSorter } from "../internal/rollDataSorter.js";
import { markRollData } from "../markup/markRollData.js";
import type { SortedRollData } from "../types/SortedDataRoll.js";
import { rollDice } from "./rollDice.js";

/** Creates the SortedRollData used to generate formatted dice output. */
export function rollDicePart(dicePart: TDicePart): SortedRollData {
	const { fixedRolls, count, sides } = dicePart;

	// start with fixed rolls
	const byIndex = fixedRolls.slice(0, count).map((roll, index) => rollDataMapper(roll, index, sides, true));

	// roll up to count
	if (byIndex.length < count) {
		byIndex.push(...rollDice(count, sides).map(roll => rollDataMapper(roll, byIndex.length, sides, false)));
	}

	const initialCount = byIndex.length;
	const initialSum = sum(byIndex, roll => roll.value);
	const unusedFixedRolls = fixedRolls.slice(count);

	let noSort = false;

	// manipulate the rolls
	dicePart.manipulation.forEach(m => {
		const args = {
			allRolls: byIndex,
			notDropped: byIndex.filter(roll => !roll.isDropped),
			unusedFixedRolls,
		};

		if (m.dropKeep) {
			m.dropKeep.manipulateRolls(args);

		}else if (m.explode) {
			const { additionalRolls, fixedRollsUsed } = m.explode.manipulateRolls(args);
			byIndex.push(...additionalRolls);
			unusedFixedRolls.splice(0, fixedRollsUsed);

		}else if (m.threshold) {
			m.threshold.manipulateRolls(args);

		}else if (m.noSort) {
			noSort = true;
		}
	});

	// mark the roll output
	byIndex.forEach(markRollData);

	const notDropped = byIndex.filter(roll => !roll.isDropped);

	return {
		byIndex,
		byValue: byIndex.slice().sort(rollDataSorter),
		count: notDropped.length,
		initialCount,
		initialSum,
		noSort,
		sum: sum(notDropped.map(roll => roll.threshold ?? roll.value))
	};
}