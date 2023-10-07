import { destroy } from "../../TypeUtils";
import type { GameMapData, MapRenderResponse, MimeType } from "../types";
import { createMapCache } from "./createMapCache.js";
import { createMapRenderResponse } from "./createMapRenderResponse.js";
import { drawMapLayer } from "./drawMapLayer.js";
import { renderBackground } from "./renderBackground.js";
import type { MapCache } from "./types";

/**
 * @private
 * Renders the given map and returns the response with a Buffer.
 */
export async function renderMap(map: GameMapData, mimeType: MimeType): Promise<MapRenderResponse> {
	let mapCache: MapCache | null = createMapCache(map, mimeType);
	let buffer: Buffer | null = null;

	const bgRendered = await renderBackground(mapCache) ?? [];
	if (bgRendered) {
		// render the layers
		const layers = map.layers;
		for (const layer of layers) {
			await drawMapLayer(mapCache, layer);
		}

		// create the buffer
		buffer = mapCache.context.canvas.toBuffer(mimeType as "image/png");
	}

	// create the response
	const response = createMapRenderResponse(mapCache!, buffer);

	// help free some memory
	mapCache = destroy(mapCache);
	buffer = null;

	// return the response
	return response;
}