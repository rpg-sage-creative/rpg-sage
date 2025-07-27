import { isDefined, verbose } from "@rsc-utils/core-utils";
import { calculateImageMeta } from "../calculate/calculateImageMeta.js";
import type { MapCache } from "./MapCache.js";
import { cacheImage } from "./cacheImages/cacheImage.js";
import { getOrCreateImageCache } from "./cacheImages/getOrCreateImageCache.js";
import type { HasPxPer } from "../types/HasPxPer.js";

/**
 * @internal
 * Fetches all the images from their urls and store them locally.
 * Uses imageSize to read the image's dimensions without loading the full image into memory.
 * Calculates the metadata for each image.
 * Calculates the mapMeta using the pxPer and mapWidth/mapHeight.
 */
export async function cacheImages(mapCache: MapCache): Promise<void> {
	const { mapMeta } = mapCache;
	const { mapData } = mapCache;
	const { background, terrain, aura, token } = mapData.layers ?? { };
	const layers = [background, terrain, aura, token].filter(isDefined);
	const pxPer: HasPxPer = { pxPerCol:0, pxPerRow:0 };

	/*
	1. cache all images
	2. use biggest pxPer from background as map pxPer
	3. use most cols/rows from background as map cols/rows
	4. calculate map width/height
	*/

	verbose(`Caching ${layers.length} layers ...`);
	for (const layerData of layers) {
		verbose(`Caching layer ${layerData.type} ...`);
		for (const imageData of layerData.images) {
			// get the imageCache
			const imageCache = getOrCreateImageCache(mapCache.images, imageData);

			// cache the file
			await cacheImage(imageCache, { mapData, layerData });

			// get the image metadata, saving the returned pxPer
			const imgMapMeta = calculateImageMeta(imageCache, imageData);

			if (imgMapMeta && layerData.type === "background") {
				// update pxPer
				pxPer.pxPerCol = Math.max(pxPer.pxPerCol, imgMapMeta.pxPerCol ?? 0);
				pxPer.pxPerRow = Math.max(pxPer.pxPerRow, imgMapMeta.pxPerRow ?? 0);

				// update grid dimensions
				mapMeta.cols = Math.max(mapMeta.cols, imgMapMeta.cols ?? 0);
				mapMeta.rows = Math.max(mapMeta.rows, imgMapMeta.rows ?? 0);
			}
		}
	}

	// use final pxPer and cols/rows to create width/height
	mapMeta.width = mapMeta.cols * pxPer.pxPerCol;
	mapMeta.height = mapMeta.rows * pxPer.pxPerRow;

}
