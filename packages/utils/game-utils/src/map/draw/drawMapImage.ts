import { Image, loadImage } from "@napi-rs/canvas";
import { error, errorReturnNull, verbose, warn } from "@rsc-utils/core-utils";
import { existsSync, writeFileSync } from "fs";
import type { ImageCache } from "../cache/ImageCache.js";
import type { GridMeta, PixelMeta } from "../cache/ImageMeta.js";
import type { LayerMeta } from "../cache/LayerMeta.js";
import { calculateScaledImage } from "../calculate/calculateScaledImage.js";
import type { Grid } from "../grid/Grid.js";
import { ensurePath } from "../utils/ensurePath.js";

export type HasGrid = { grid:Grid; invalidImages:Set<string>; };

let debugIndexer = 0;

type GridArgs = { grid:Grid; image:Image; imageMeta:GridMeta; layerMeta:LayerMeta; };
function drawWithGridMeta({ grid, image, imageMeta, layerMeta }: GridArgs): void {

	const layerOffset = layerMeta.pixelOffset;
	const dX = grid.dX + (layerOffset?.x ?? 0);
	const dY = grid.dY + (layerOffset?.y ?? 0);

	const { clip, gridRect, opacity, scale } = imageMeta;
	const { col, row, cols, rows } = gridRect;

	grid.drawToken(
		{ col, row },
		{ image, ...clip, ...scale, cols, rows },
		{ alpha:opacity, dX, dY } // fillStyle?
	);
}

type PixelArgs = { grid:Grid; image:Image; imageMeta:PixelMeta; layerMeta:LayerMeta; };
function drawWithPixelMeta({ grid, image, imageMeta, layerMeta }: PixelArgs): void {
	const { clipX, clipY, clipWidth, clipHeight } = imageMeta.clip;
	const { pixelRect } = imageMeta;

	const drawX = pixelRect.x;
	const drawY = pixelRect.y;
	const drawWidth = pixelRect.width;
	const drawHeight = pixelRect.height;

	const layerOffset = layerMeta.pixelOffset;
	const dX = grid.dX + (layerOffset?.x ?? 0);
	const dY = grid.dY + (layerOffset?.y ?? 0);

	const scaled = calculateScaledImage({ x:drawX, y:drawY, width:drawWidth, height:drawHeight }, imageMeta.scale);

	/** @todo start using the grid.drawImage logic so we can use hex grids. */
	const { context } = grid;
	context.save();
	context.globalAlpha = imageMeta.opacity ?? 1;
	context.drawImage(image, clipX, clipY, clipWidth, clipHeight, dX + scaled.x, dY + scaled.y, scaled.width, scaled.height);
	context.restore();
}

/**
 * @internal
 * Draws the given image.
 */
export async function drawMapImage({ grid, invalidImages }: HasGrid, layerMeta: LayerMeta, imageCache: ImageCache): Promise<void> {
	if (!imageCache.cachePath) {
		warn(`Cannot draw image without cachePath: `, imageCache);
		return;
	}

	const { imageMeta } = imageCache;
	if (!imageMeta) {
		warn(`Cannot draw image without imageMeta: `, imageCache);
		return;
	}

	const image = await loadImage(imageCache.cachePath).catch(errorReturnNull);
	if (!image) {
		warn(`Cannot draw image that isn't cached: `, imageCache);
		return;
	}

	try {

		if ("gridRect" in imageMeta) {
			drawWithGridMeta({ grid, image, imageMeta, layerMeta });

		}else {
			drawWithPixelMeta({ grid, image, imageMeta, layerMeta });
		}

		if (existsSync("/Users/randaltmeyer")) {
			ensurePath({dirPath:"./test/out/cache/debug"});
			writeFileSync(`./test/out/cache/debug/step-${debugIndexer++}.webp`, grid.toBuffer({ mimeType:"image/webp" })!);
		}

	}catch(ex) {
		verbose(`drawMapImage(imageCache = ${JSON.stringify(imageCache)})`);
		// verbose(`context.drawImage(image, ${clipX}, ${clipY}, ${clipWidth}, ${clipHeight}, ${drawX}, ${drawY}, ${drawWidth}, ${drawHeight});`);
		error(ex);
		invalidImages.add(imageCache.url);
	}
}
