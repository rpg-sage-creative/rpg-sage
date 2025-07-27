import type { HasClip } from "../types/HasClip.js";
import type { HasGridDimensions } from "../types/HasGridDimensions.js";
import type { HasPxPer } from "../types/HasPxPer.js";

/** Calculates pxPer using the clipWidth/clipHeight values (assumed to be from calculateValidClip). */
export function calculateClippedPxPer({ cols, rows }: Partial<HasGridDimensions> = { }, { clipWidth, clipHeight }: Partial<HasClip> = { }): HasPxPer | undefined {
	const pxPerCol = cols && clipWidth ? clipWidth / cols : undefined;
	const pxPerRow = rows && clipHeight ? clipHeight / rows : undefined;
	return pxPerCol && pxPerRow ? { pxPerCol, pxPerRow } : undefined;
}