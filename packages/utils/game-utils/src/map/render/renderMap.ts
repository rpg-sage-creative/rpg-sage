import { uncache, verbose } from "@rsc-utils/core-utils";
import type { MapCache } from "../cache/MapCache.js";
import { cacheImages } from "../cache/cacheImages.js";
import { createMapCache } from "../cache/createMapCache.js";
import { Grid } from "../grid/Grid.js";
import type { GameMapData, MapRenderResponse, MimeType } from "../types/index.js";
import type { HasChangesData } from "./HasChangesData.js";
import { createMapRenderResponse } from "./createMapRenderResponse.js";
import { renderLayer } from "./renderLayer.js";

/*
1- cache all images locally
1a- get all image dimensions
1b- calculate all clip dimensions
1c- get pxPer (first image with cols/rows)
1d- calculate map meta
2- create grid/canvas
3- draw layers
3a- background
3b- terrain
3c- grid
3d- aura
3e- token
4- create buffer
5- create response
6- free memory
*/

/**
 * @internal
 * Renders the given map and returns the response with a Buffer.
 */
export async function renderMap(mapData: GameMapData, mimeType: MimeType, changes?: HasChangesData): Promise<MapRenderResponse> {
	verbose(`Rendering map "${mapData.name}" ...`);

	let mapCache: MapCache | undefined = createMapCache(mapData, mimeType) as MapCache;
	let buffer: Buffer | undefined = undefined;

	// 1- cache all images locally, calculate all metadata
	await cacheImages(mapCache);

	const { width, height } = mapCache.mapMeta;
	if (width && height) {

		// 2- create grid/canvas
		const gridArgs = { gridType:mapData.grid?.gridType ?? "square", ...mapData.grid, ...mapCache.mapMeta };
		mapCache.grid = new Grid({ gridColor:"#0000", ...gridArgs, width, height });

		/** @todo create and cache an image that includes background, terrain, and non token auras */
		// 3- draw layers
		await renderLayer(mapCache, "background", changes);
		await renderLayer(mapCache, "terrain", changes);
		mapCache.grid.drawGrid();
		await renderLayer(mapCache, "aura", changes);
		await renderLayer(mapCache, "token", changes);
		mapCache.grid.drawKeys();

		// 4- create buffer
		buffer = mapCache.grid.toBuffer({ mimeType });
	}

	// 5- create the response
	const response = createMapRenderResponse(mapCache, buffer);

	// 6- help free some memory
	mapCache.grid.destroy();
	mapCache = uncache(mapCache, { undefine:true }) ?? undefined;
	buffer = undefined;

	// return the response
	return response;
}