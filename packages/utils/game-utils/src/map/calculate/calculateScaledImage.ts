import type { Optional } from "@rsc-utils/core-utils";
import type { HasPixelDimensions } from "../types/HasDimensions.js";
import type { HasScale } from "../types/HasScale.js";
import type { Point } from "../types/Point.js";

function scaleDim(point: number, length: number, scale = 1): { point:number, length:number; } {
	if (scale && scale !== 1) {
		// get new height/width
		const scaledLength = length * scale;

		// get change in height/width
		const deltaLength = scaledLength - length;

		// get change in x/y
		const deltaPoint = deltaLength / 2;

		// adjust x/y
		point -= deltaPoint;

		// change height/width
		length = scaledLength;
	}
	return { point, length };
}

/** Scales the image dimensions and adjusts the x,y so that the image is still "centered" where it was before. */
export function calculateScaledImage(image: Point & HasPixelDimensions, hasScale: Optional<HasScale>): Point & HasPixelDimensions {
	const scaledX = scaleDim(image.x, image.width, hasScale?.scaleX ?? hasScale?.scale);
	const scaledY = scaleDim(image.y, image.height, hasScale?.scaleY ?? hasScale?.scale);
	return {
		x: scaledX.point,
		y: scaledY.point,
		width: scaledX.length,
		height: scaledY.length
	};
}