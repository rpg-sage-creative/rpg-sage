import type { SKRSContext2D } from "@napi-rs/canvas";
import type { GameMapData } from "../types/GameMapData.js";
import type { MimeType } from "../types/MimeType.js";
import type { MapCache } from "./MapCache.js";
// import { Grid } from "../Grid.js";

type NewMapCache = Omit<Omit<MapCache, "context">, "grid"> & {
	context?: SKRSContext2D;
	// grid?: Grid;
};

/**
 * @internal
 * Creates a MapCache object to pass around while rendering.
 */
export function createMapCache(mapData: GameMapData, mimeType: MimeType): NewMapCache {
	return {
		images: new Map(),
		invalidImages: new Set(),
		invalidImageUrls: new Set(),
		mapData,
		mapMeta: { width:0, height:0, cols:0, rows:0 },
		mimeType
	};
}