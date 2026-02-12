import type { RollData } from "./RollData.js";

/** Contains the Roll Data length and sorted arrays. */
export type SortedRollData = {
	/** Sorted by index */
	byIndex: RollData[];

	/** Sorted by roll (value/result) */
	byValue: RollData[];

	/** Final count of all the dice after manipulation */
	count: number;

	/** Initial count of all the dice before manipulation */
	initialCount: number;

	/** Initial sum of all the dice before manipulation */
	initialSum: number;

	/** Was the noSort flag (ns) given? */
	noSort: boolean;

	/** Final summ of all the dice after manipulation */
	sum: number;
};