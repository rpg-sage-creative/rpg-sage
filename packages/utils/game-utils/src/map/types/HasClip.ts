
/** This object type has a clip rectangle. */
export type HasClip = {
	/** x-axis pixels to start rendering from */
	clipX: number;

	/** y-axis pixels to start rendering from */
	clipY: number;

	/** total pixel width to render; a negative number clips that many pixels off the end of the x-axis */
	clipWidth: number;

	/** total pixel height to render a negative number clips that many pixels off the end of the y-axis */
	clipHeight: number;
};
