import type { Image, SKRSContext2D } from "@napi-rs/canvas";
import { Color, type HexColorString } from "@rsc-utils/core-utils";
import { calculateScaledImage } from "../calculate/calculateScaledImage.js";
import type { HasClip } from "../types/HasClip.js";
import type { HasGridDimensions } from "../types/HasGridDimensions.js";
import type { HasPxPer } from "../types/HasPxPer.js";
import type { HasScale } from "../types/HasScale.js";
import type { GridTile } from "./GridTile.js";
import { fillTile } from "./fillTile.js";

export type DrawTokenMeta = HasClip & HasGridDimensions & HasScale & {
	image: Image;
};

export type DrawTokenArgs = {
	alpha?: number;
	context?: SKRSContext2D;
	dX?: number;
	dY?: number;
	fillStyle?: HexColorString;
};

/** For simple token image drawing. If you need complicated image manipulation, you are looking for drawMapImage. */
export function drawToken(tile: GridTile, tokenMeta: DrawTokenMeta, args: HasPxPer & DrawTokenArgs) {
	if (!tokenMeta?.image) throw new TypeError(`Invalid DrawTokenMeta: missing "image"!`); // NOSONAR
	if (!args.context) throw new TypeError(`Invalid DrawTokenArgs: missing "context"!`); // NOSONAR

	const { image, clipX = 0, clipY = 0, clipWidth = image.width, clipHeight = image.height, cols = 1, rows = 1 } = tokenMeta;

	const { alpha = 1, context, dX = 0, dY = 0 } = args;

	// get unscaled image rectangle
	const x = tile.least.x + dX;
	const y = tile.least.y + dY;
	const width = args.pxPerCol * cols;
	const height = args.pxPerRow * rows;

	// scale the image rectangle
	const scaled = calculateScaledImage({ x, y, width, height }, tokenMeta);

	if (args.fillStyle) {
		const fillStyle = Color.from(args.fillStyle, alpha).hexa;
		fillTile(tile, { ...args, fillStyle });
	}

	context.save();
	context.globalAlpha = alpha;
	context.drawImage(image, clipX, clipY, clipWidth, clipHeight, scaled.x, scaled.y, scaled.width, scaled.height);
	context.restore();
}