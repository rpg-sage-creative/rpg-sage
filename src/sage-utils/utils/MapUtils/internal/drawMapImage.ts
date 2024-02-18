import { error, verbose } from "@rsc-utils/console-utils";
import { stringify } from "@rsc-utils/json-utils";
import type { GameMapLayerImage } from "../types";
import { calculateValidClip } from "./calculateValidClip.js";
import { gridOffsetToZeroZero } from "./gridOffsetToZeroZero.js";
import { loadImage } from "./loadImage.js";
import type { MapCache, MapLayerMeta } from "./types";

/**
 * @private
 * Draws the given image.
 */
export async function drawMapImage(mapArgs: MapCache, mapLayerMeta: MapLayerMeta, mapLayerImage: GameMapLayerImage): Promise<void> {
	const imgImage = await loadImage(mapArgs, mapLayerImage);
	if (imgImage) {
		const [imgClipX, imgClipY, imgClipWidth, imgClipHeight] = calculateValidClip(mapLayerImage, imgImage),
			scale = mapLayerImage.scale ?? 1,
			gridOffset = gridOffsetToZeroZero(mapLayerImage.gridOffset),
			imgOffsetX = mapLayerImage.pixelOffset?.[0] ?? (gridOffset[0] * mapLayerMeta.pxPerCol),
			imgWidth = (mapLayerImage.size[0] ?? 1) * mapLayerMeta.pxPerCol,
			scaledImgWidth = imgWidth * scale,
			scaledImgOffsetX = imgOffsetX - (scaledImgWidth - imgWidth) / 2,
			imgOffsetY = mapLayerImage.pixelOffset?.[1] ?? (gridOffset[1] * mapLayerMeta.pxPerRow),
			imgHeight = (mapLayerImage.size[1] ?? 1) * mapLayerMeta.pxPerRow,
			scaledImgHeight = imgHeight * scale,
			scaledImgOffsetY = imgOffsetY - (scaledImgHeight - imgHeight) / 2,
			opacity = mapLayerImage.opacity ?? 1;
		try {
			mapArgs.context.globalAlpha = opacity;
			mapArgs.context.drawImage(imgImage, imgClipX, imgClipY, imgClipWidth, imgClipHeight, mapLayerMeta.layerOffsetX + scaledImgOffsetX, mapLayerMeta.layerOffsetY + scaledImgOffsetY, scaledImgWidth, scaledImgHeight);
		}catch(ex) {
			verbose(`mapArgs.context.drawImage(imgImage = ${stringify(mapLayerImage)}, ${imgClipX}, ${imgClipY}, ${imgClipWidth}, ${imgClipHeight}, ${mapLayerMeta.layerOffsetX + imgOffsetX}, ${mapLayerMeta.layerOffsetY + imgOffsetY}, ${imgWidth}, ${imgHeight});`);
			error(ex);
			mapArgs.invalidImages.add(mapLayerImage.url);
		}
	}
}