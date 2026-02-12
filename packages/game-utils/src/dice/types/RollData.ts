export type RollData = {
	dieSize: number;

	/** The original index of the roll (order it was rolled in) */
	index: number;

	/** The value initially rolled. */
	initialValue: number;

	/** Is the initial value above the high threshold value? */
	isAboveThreshold?: boolean;

	/** Is the initial value below the low threshold value? */
	isBelowThreshold?: boolean;

	/** Has the roll been dropped. */
	isDropped?: boolean;

	/** Is this roll causing an explosion. */
	isExploded?: boolean;

	/** Is this roll the result of an explosion. */
	isExplosion?: boolean;

	/** Is the roll/result fixed. */
	isFixed?: boolean;

	/** Is the roll the min value. */
	isMin?: boolean;

	/** Is the roll the max value. */
	isMax?: boolean;

	/** String output to be marked as: min, max, dropped, etc. */
	text: string;

	/** The threshold checked against. */
	threshold?: number;

	/** The value after manipulation (such as threshold) */
	value: number;
};
