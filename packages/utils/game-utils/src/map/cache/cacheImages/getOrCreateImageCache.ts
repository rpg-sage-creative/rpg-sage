import { type GameMapImage } from "../../types/GameMapImage.js";
import { type ImageCache } from "../ImageCache.js";

/**
 * @internal
 * Makes sure we have a cache object for the url before returning it.
 */
export function getOrCreateImageCache(imageMap: Map<string, ImageCache | null>, { id, url }: GameMapImage): ImageCache {
	if (!imageMap.has(url)) {
		imageMap.set(url, { imageId:id, url });
	}
	return imageMap.get(url)!;
}
