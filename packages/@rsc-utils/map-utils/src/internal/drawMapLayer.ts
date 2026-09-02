import type { Optional } from "@rsc-utils/core-utils";
import type { GameMapLayerData } from "../types.js";
import { drawMapImage } from "./drawMapImage.js";
import { gridOffsetToZeroZero } from "./gridOffsetToZeroZero.js";
import type { MapCache } from "./types.js";

/**
 * @private
 * Draws all images for the given layer, ensuring offsets are adhered to.
 */
export async function drawMapLayer(mapArgs: MapCache, mapLayer: Optional<GameMapLayerData>): Promise<void> {
	const images = mapLayer?.images;
	if (images?.length) {
		const layerOffset = mapLayer!.offset,
			gridOffset = gridOffsetToZeroZero(layerOffset?.gridOffset),
			layerOffsetX = layerOffset?.pixelOffset?.[0] ?? (gridOffset[0] * mapArgs.mapMeta.pxPerCol),
			layerOffsetY = layerOffset?.pixelOffset?.[1] ?? (gridOffset[1] * mapArgs.mapMeta.pxPerRow),
			mapLayerMeta = { layerOffsetX, layerOffsetY, ...mapArgs.mapMeta };

		for (const imgMeta of images) {
			await drawMapImage(mapArgs, mapLayerMeta, imgMeta);
		}
	}
}