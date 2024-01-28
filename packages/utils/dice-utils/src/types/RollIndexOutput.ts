export type RollIndexOutput = {
	/** The roll value */
	roll: number;
	/** The original index of the roll (order it was rolled in) */
	index: number;
	/** String output to be bolded, italicized, or striked */
	output: string;
};