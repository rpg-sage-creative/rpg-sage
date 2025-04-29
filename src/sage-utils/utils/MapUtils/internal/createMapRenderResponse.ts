import type { MapRenderResponse } from "../types.js";
import type { MapCache } from "./types.js";

/**
 * @private
 * Creates a MapRenderResponse from the given MapCache and image Buffer.
 */
export function createMapRenderResponse(mapCache: MapCache, imgBuffer: Buffer | null): MapRenderResponse {
	return {
		base64: imgBuffer?.toString("base64") ?? null,
		invalidImages: [...mapCache.invalidImages],
		invalidImageUrls: [...mapCache.invalidImageUrls],
		mapData: mapCache.mapData,
		mimeType: mapCache.mimeType
	};
}