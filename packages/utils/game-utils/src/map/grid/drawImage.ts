import type { Image, SKRSContext2D } from "@napi-rs/canvas";
import { Color, type HexColorString } from "@rsc-utils/core-utils";
import type { HasClip } from "../types/HasClip.js";
import type { HasPixelDimensions } from "../types/HasDimensions.js";
import type { Point } from "../types/Point.js";
import type { GridTile } from "./GridTile.js";
import { fillTile } from "./fillTile.js";

export type DrawImageMeta = HasClip & HasPixelDimensions & Point & {
	image: Image;
};

export type DrawImageArgs = {
	alpha?: number;
	context?: SKRSContext2D;
	dX?: number;
	dY?: number;
	fillStyle?: HexColorString;
};

/** For simple image drawing. If you need complicated image manipulation, you are looking for drawMapImage. */
export function drawImage(tile: GridTile, imageMeta: DrawImageMeta, args: DrawImageArgs) {
	if (!imageMeta?.image) throw new TypeError(`Invalid DrawImageMeta: missing "image"!`); // NOSONAR
	if (!args.context) throw new TypeError(`Invalid DrawImageArgs: missing "context"!`); // NOSONAR

	const {
		image,
		clipX = 0, clipY = 0, clipWidth = image.width, clipHeight = image.height,
		x = 0, y = 0, width = image.width, height = image.height
	} = imageMeta;

	const { alpha = 1, context, dX = 0, dY = 0 } = args;

	if (args.fillStyle) {
		const fillStyle = Color.from(args.fillStyle, alpha).hexa;
		fillTile(tile, { ...args, fillStyle });
	}

	context.save();
	context.globalAlpha = alpha;
	context.drawImage(image, clipX, clipY, clipWidth, clipHeight, dX + x, dY + y, width, height);
	context.restore();
}