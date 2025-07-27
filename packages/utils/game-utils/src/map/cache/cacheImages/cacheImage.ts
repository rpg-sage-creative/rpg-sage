import { error } from "@rsc-utils/core-utils";
import type { GameMapData } from "../../types/GameMapData.js";
import type { GameMapLayerData } from "../../types/GameMapLayer.js";
import { urlToFileExt } from "../../utils/urlToFileExt.js";
import type { ImageCache } from "../ImageCache.js";
import { getMapImageCachePath } from "../getMapImageCachePath.js";
import { copyOrCacheImage } from "./copyOrCacheImage.js";

/**
 * @internal
 * Caches the file locally if we haven't already.
 */
export async function cacheImage(imageCache: ImageCache, { mapData, layerData }: { mapData:GameMapData; layerData:GameMapLayerData; }): Promise<void> {
	if (imageCache.cachePath === undefined) {
		try {
			const mapId = mapData.id;
			const layerId = layerData.id;
			const userId = mapData.userId;
			const imageId = imageCache.imageId;
			const imageExt = urlToFileExt(imageCache.url, "png");
			const cachePath = getMapImageCachePath({ mapId, layerId, userId, imageId, imageExt });
			const success = await copyOrCacheImage(imageCache.url, cachePath);
			imageCache.cachePath = success ? cachePath : null;
		}catch(ex) {
			error(`Error caching image:`, imageCache.url);
			error(ex);
			imageCache.cachePath = null;
		}
	}
}
