import type { GameMapLayerData } from "../types/GameMapLayer.js";
import type { MimeType } from "../types/MimeType.js";
import type { MapCache } from "./MapCache.js";

export type LayerCache = {
	cacheExists: boolean;
	cachePath: string;
	layer: GameMapLayerData;
	mapCache: MapCache;
	mimeType: MimeType;
};
