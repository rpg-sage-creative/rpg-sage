import type { GameMapData, MimeType } from "../types.js";
import type { MapCache } from "./types.js";

/**
 * @private
 * Creates a MapCache object to pass around while rendering.
 */
export function createMapCache(mapData: GameMapData, mimeType: MimeType): MapCache {
	return {
		context: undefined!,
		mapData,
		images: new Map(),
		invalidImages: new Set(),
		invalidImageUrls: new Set(),
		mapMeta: undefined!,
		mimeType
	};
}