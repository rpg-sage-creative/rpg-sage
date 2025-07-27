import { type MapCache } from "../cache/MapCache.js";
import { drawMapLayer } from "../draw/drawMapLayer.js";
import { type LayerType } from "../types/LayerType.js";
import { type HasChangesData } from "./HasChangesData.js";

/** @internal */
export async function renderLayer(mapCache: MapCache, layerType: LayerType, changes?: HasChangesData): Promise<void> {
	const layer = mapCache.mapData.layers[layerType];
	if (layer) {
		const layerChanges = { useCache:changes?.useCache, hasChanges:changes?.[layerType] };
		await drawMapLayer(mapCache, layer, layerChanges);
	}
}
