import type { HasClip } from "../types/HasClip.js";
import type { HasPixelDimensions } from "../types/HasDimensions.js";
import type { HasNaturalDimensions } from "../types/HasNaturalDimensions.js";

/**
 * Generic function that calculates the x/y and width/height values for a clip region.
 */
function calculateDimension(clip: Partial<HasClip>, image: Partial<HasNaturalDimensions & HasPixelDimensions>, xOrY: "X" | "Y"): [number, number] {
	const widthOrHeight = xOrY === "X" ? "Width" : "Height";
	const naturalLength = image[`natural${widthOrHeight}`];
	const baseLength = image[xOrY === "X" ? "width" : "height"];
	const originalLength = naturalLength || baseLength || 0; // NOSONAR

	//#region clip point

	const initialPoint = clip[`clip${xOrY}`] ?? 0;

	// calculate x (or y) from right (or bottom) [if negative] or left (or top)
	const calculatedPoint = initialPoint < 0 ? originalLength + initialPoint : initialPoint ?? 0;

	// check the boundaries
	const boundedPoint = Math.min(Math.max(calculatedPoint, 0), originalLength - 1);

	//#endregion

	//#region clip length

	const initialLength = clip[`clip${widthOrHeight}`] ?? 0;

	// calculate width (or height)
	const calculatedLength = initialLength < 0 ? originalLength + initialLength - boundedPoint : initialLength || originalLength;

	// check the boundaries
	const boundedLength = Math.min(Math.max(calculatedLength, 0), originalLength - boundedPoint);

	//#endregion

	return [boundedPoint, boundedLength];
}

/**
 * @internal
 * Calculates a valid clip region based on the given clip and dimensions.
 * Ensures the rectangle is within the confines of the image.
 */
export function calculateValidClip(clip: Partial<HasClip>, image: Partial<HasNaturalDimensions & HasPixelDimensions>): HasClip {
	const [clipX, clipWidth] = calculateDimension(clip, image, "X");
	const [clipY, clipHeight] = calculateDimension(clip, image, "Y");
	return { clipX, clipY, clipWidth, clipHeight };
}