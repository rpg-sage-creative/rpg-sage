
/**
 * Has a scale multiplier for scaling something.
 * For instance, for token art that bleeds over their token/base.
 */
export type HasScale = {
	/** The multiplier to use when scaling */
	scale?: number;
	scaleX?: number;
	scaleY?: number;
};
