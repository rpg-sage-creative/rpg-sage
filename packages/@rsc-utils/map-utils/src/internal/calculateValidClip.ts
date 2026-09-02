import type { HasClip, HasNatural } from "../types.js";
import type { ValidClip } from "./types.js";

/**
 * @private
 * Calculates a valid clip region based on the given clip and dimensions.
 */
export function calculateValidClip(clip: Partial<HasClip>, natural: HasNatural): ValidClip {
	//#region x
	const clipX = clip.clipX ?? 0;
	// calculate x from right (if negative) or left
	const cX = clipX < 0 ? natural.naturalWidth + clipX : clipX ?? 0;
	// check the boundaries
	const x = Math.min(Math.max(cX, 0), natural.naturalWidth - 1);
	//#endregion

	//#region width
	const clipWidth = clip.clipWidth ?? 0;
	// calculate clipWidth
	const cW = clipWidth < 0 ? natural.naturalWidth + clipWidth - x : clipWidth || natural.naturalWidth;
	// check the boundaries
	const w = Math.min(Math.max(cW, 0), natural.naturalWidth - x);
	//#endregion

	//#region y
	const clipY = clip.clipY ?? 0;
	// calculate y from top (if negative) or bottom
	const cY = clipY < 0 ? natural.naturalHeight + clipY : clipY ?? 0;
	// check the boundaries
	const y = Math.min(Math.max(cY, 0), natural.naturalHeight - 1);
	//#endregion

	//#region height
	const clipHeight = clip.clipHeight ?? 0;
	// calculate clipHeight
	const cH = clipHeight < 0 ? natural.naturalHeight + clipHeight - y : clipHeight || natural.naturalHeight;
	// check the boundaries
	const h = Math.min(Math.max(cH, 0), natural.naturalHeight - y);
	//#endregion

	return [x, y, w, h];
}