import { loadImage } from "@napi-rs/canvas";
import { error, errorReturnNull, isDefined, verbose, type Optional } from "@rsc-utils/core-utils";
import { writeFileSync } from "fs";
import type { LayerCache } from "../cache/LayerCache.js";
import type { LayerMeta } from "../cache/LayerMeta.js";
import type { MapCache } from "../cache/MapCache.js";
import { createLayerCache } from "../cache/createLayerCache.js";
import { calculateOffset } from "../calculate/calculateOffset.js";
import type { GameMapLayerData } from "../types/GameMapLayer.js";
import { drawMapImage, type HasGrid } from "./drawMapImage.js";

async function drawImages(hasGrid: HasGrid, { layer, mapCache }: LayerCache, layerMeta: LayerMeta): Promise<void> {
	const images = layer.images.map(imageData => mapCache.images.get(imageData.url)).filter(isDefined);
	for (const imageCache of images) {
		await drawMapImage(hasGrid, layerMeta, imageCache);
	}
}

async function createCache(layerCache: LayerCache): Promise<boolean> {
	try {
		const { mapCache, mimeType } = layerCache;

		// create layer metadata
		const pixelOffset = calculateOffset(layerCache.layer, mapCache.grid);
		const { width, height, ...hasPxPer } = mapCache.mapMeta;
		const layerMeta: LayerMeta = { ...hasPxPer, pixelOffset, type:layerCache.layer.type };

		// create layer context
		const { invalidImages } = mapCache;
		const hasGrid = { grid:layerCache.mapCache.grid.clone(), invalidImages };

		// draw the images
		await drawImages(hasGrid, layerCache, layerMeta);

		writeFileSync(layerCache.cachePath, hasGrid.grid.toBuffer({ mimeType })!);
		return true;

	}catch(ex) {
		verbose(`Error creating Layer image cache:`, layerCache.cachePath);
		error(ex);
	}
	return false;
}

async function drawFromCache({ cacheExists, cachePath, mapCache }: LayerCache): Promise<boolean> {
	try {
		if (cacheExists) {
			const layerImage = await loadImage(cachePath).catch(errorReturnNull);
			if (layerImage) {
				mapCache.grid.context.drawImage(layerImage, mapCache.grid.dX, mapCache.grid.dY);
				return true;
			}
		}
	}catch(ex) {
		verbose(`Error loading cached layer image:`, cachePath);
		error(ex);
	}
	return false;
}

/**
 * @internal
 * Draws all images for the given layer, ensuring offsets are adhered to.
 */
export async function drawMapLayer(mapCache: MapCache, layer: Optional<GameMapLayerData>, { useCache=true, hasChanges=true }): Promise<void> {
	if (!layer?.images.length) {
		return;
	}

	const layerCache = createLayerCache(mapCache, layer);
	if (useCache) {
		if (hasChanges || !layerCache.cacheExists) {
			const cached = await createCache(layerCache);
			verbose(`Map Layer (${layer.id}) cached: ${cached}`);
		}
		const usedCache = await drawFromCache(layerCache);
		if (usedCache) {
			return;
		}
	}

	const pixelOffset = calculateOffset(layer, mapCache.grid);
	const layerMeta: LayerMeta = { pixelOffset, type:layer.type };

	await drawImages(mapCache, layerCache, layerMeta);
}
