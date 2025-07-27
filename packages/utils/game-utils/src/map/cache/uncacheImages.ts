import { error, uncache } from "@rsc-utils/core-utils";
import { existsSync, rmSync } from "fs";
import type { MapCache } from "./MapCache.js";

/**
 * @internal
 */
export async function uncacheImages(mapCache: MapCache): Promise<void> {
	const { images } = mapCache;
	for (const [url, imageData] of images) {
		try {
			if (imageData?.cachePath && existsSync(imageData.cachePath)) {
				rmSync(imageData.cachePath);
			}
		}catch(ex) {
			error(`Error deleting cached map image:`, imageData?.cachePath);
		}
		uncache(imageData);
		images.delete(url);
	}
}