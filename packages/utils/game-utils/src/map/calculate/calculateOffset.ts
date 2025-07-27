import type { HasOffset } from "../types/HasOffset.js";
import type { HasPxPer } from "../types/HasPxPer.js";
import type { Point } from "../types/Point.js";

/**
 * @internal
 * Returns the pixel offset of the image.
 * If no pixelOffset exists, one is calculated using col/row and pxPerCol/pxPerRow.
 * Returns 0,0 if no offset is found.
 */
export function calculateOffset({ pixelOffset, gridOffset }: HasOffset, { pxPerCol, pxPerRow }: Partial<HasPxPer> = { }): Point {
	if (pixelOffset) {
		return pixelOffset;
	}
	if (gridOffset && pxPerCol && pxPerRow) {
		return {
			x: gridOffset.col * pxPerCol,
			y: gridOffset.row * pxPerRow
		};
	}
	return { x:0, y:0 };
}