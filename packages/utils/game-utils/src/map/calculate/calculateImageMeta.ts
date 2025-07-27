import { error } from "@rsc-utils/core-utils";
import type { ImageCache } from "../cache/ImageCache.js";
import type { GridMeta, GridRect, PixelRect, ScaleMeta } from "../cache/ImageMeta.js";
import type { GameMapImage } from "../types/GameMapImage.js";
import type { HasClip } from "../types/HasClip.js";
import type { HasGridDimensions } from "../types/HasGridDimensions.js";
import type { HasPxPer } from "../types/HasPxPer.js";
import { calculateClippedPxPer } from "./calculateClippedPxPer.js";
import { calculateValidClip } from "./calculateValidClip.js";
import { bufferToMetadata, readFileSync } from "@rsc-utils/io-utils";

type Results = Partial<HasPxPer & HasGridDimensions>;

function calcGridRect(image: GameMapImage): GridRect | undefined {
	if (image.cols && image.rows) {
		const { col = 1, row = 1 } = image.gridOffset ?? { };
		const { cols = 0, rows = 0 } = image;
		return { col, row, cols, rows };
	}
	return undefined;
}

function calcPixelRect(image: GameMapImage, clip: HasClip): PixelRect | undefined {
	if (image.width && image.height) {
		const { x = 0, y = 0 } = image.pixelOffset ?? { };
		const { width = clip.clipWidth, height = clip.clipHeight } = image;
		return { x, y, width, height };
	}
	return undefined;
}

function calcScale(image: GameMapImage): ScaleMeta | undefined {
	const scaleX = image?.scaleX ?? image.scale;
	const scaleY = image?.scaleY ?? image.scale;
	return scaleX || scaleY ? { scaleX, scaleY } : undefined;
}

function calcMapGridDim(gridMeta: GridRect | undefined): HasGridDimensions | undefined {
	if (gridMeta) {
		// col/row is actually 1,1 based, so we have to subtract 1 when calculating number of cols/rows
		const cols = gridMeta.col + gridMeta.cols - 1;
		const rows = gridMeta.row + gridMeta.rows - 1;
		return { cols, rows };
	}
	return undefined;
}

// function calcMapPixelDimensions(pixelMeta: PixelMeta | undefined): HasPixelDimensions | undefined {
// 	if (pixelMeta) {
// 		const width = pixelMeta.x + pixelMeta.width;
// 		const height = pixelMeta.y + pixelMeta.height;
// 		return { width, height };
// 	}
// 	return undefined;
// }

/**
 * @internal
 * Reads the dimensions of the cached image along with given info to create image metadata for rendering.
 */
export function calculateImageMeta(imageCache: ImageCache, image: GameMapImage): Results | undefined {
	if (imageCache.imageMeta === undefined && imageCache.cachePath) {
		try {
			// get dimensions
			const buffer = readFileSync(imageCache.cachePath);
			const meta = bufferToMetadata(buffer);
			const dimensions = {
				width: meta?.width ?? 0,
				height: meta?.height ?? 0
			};

			// calculate clip info
			const clip = calculateValidClip(image, dimensions);

			// calculate gridRect
			const gridRect = calcGridRect(image);

			// calculate pixelRect
			const pixelRect = calcPixelRect(image, clip);

			// calculate scale
			const scale = calcScale(image);

			// set metadata
			imageCache.imageMeta = {
				clip,
				gridRect,
				opacity: image.opacity,
				pixelRect,
				scale
			} as GridMeta;

			// calculate pxPer
			const pxPer = calculateClippedPxPer(gridRect, clip);

			// calculate map cols/rows
			const mapGridDim = calcMapGridDim(gridRect);

			// const mapPixelDimensions = calcMapPixelDimensions(pixelMeta);

			return { ...pxPer, ...mapGridDim };

		}catch(ex) {
			error(`Error getting image meta:`, imageCache.cachePath);
			error(ex);
			imageCache.imageMeta = null;
		}
	}
	return undefined;
}
