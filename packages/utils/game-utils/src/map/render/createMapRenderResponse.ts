import type { MapCache } from "../cache/MapCache.js";
import type { MapRenderResponse } from "../types/MapRenderResponse.js";

/**
 * @internal
 * Creates a MapRenderResponse from the given MapCache and image Buffer.
 */
export function createMapRenderResponse(mapCache: MapCache, imgBuffer: Buffer | undefined): MapRenderResponse {
	return {
		base64: imgBuffer?.toString("base64"),
		invalidImages: [...mapCache.invalidImages],
		invalidImageUrls: [...mapCache.invalidImageUrls],
		mapData: mapCache.mapData,
		mimeType: mapCache.mimeType
	};
}