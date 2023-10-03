import type { MapCache } from "./types";

/**
 * @private
 * Attempts to be proactive with memory cleanup.
 */
export function destroyMapCache(mapCache: Partial<MapCache>): void {
	delete mapCache.context;
	delete mapCache.mapData;
	mapCache.images?.clear();
	delete mapCache.images;
	mapCache.invalidImages?.clear();
	delete mapCache.invalidImages;
	mapCache.invalidImageUrls?.clear();
	delete mapCache.invalidImageUrls;
	delete mapCache.mapMeta;
	delete mapCache.mimeType;
}