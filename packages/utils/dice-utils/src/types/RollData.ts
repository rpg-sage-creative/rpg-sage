export type RollData = {
	/** The original index of the roll (order it was rolled in) */
	index: number;

	/** Has the roll been dropped. */
	isDropped?: boolean;

	/** Is the roll/result fixed. */
	isFixed?: boolean;

	/** Is the roll the min value. */
	isMin?: boolean;

	/** Is the roll the max value. */
	isMax?: boolean;

	/** String output to be marked as: min, max, dropped, etc. */
	output: string;

	/** The roll value */
	roll: number;
};
