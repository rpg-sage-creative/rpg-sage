import { existsSync } from "fs";
import { type GameMapLayerData } from "../types/GameMapLayer.js";
import { type LayerCache } from "./LayerCache.js";
import { type MapCache } from "./MapCache.js";
import { getMapLayerCacheMimeType, getMapLayerCachePath } from "./getMapLayerCachePath.js";


/** @internal */
export function createLayerCache(mapCache: MapCache, layer: GameMapLayerData): LayerCache {
	const cachePath = getMapLayerCachePath({ mapId:mapCache.mapData.id, layerId:layer.id, userId:mapCache.mapData.userId });
	const cacheExists = cachePath ? existsSync(cachePath) : false;
	const mimeType = getMapLayerCacheMimeType();
	return { cacheExists, cachePath, layer, mapCache, mimeType };
}
