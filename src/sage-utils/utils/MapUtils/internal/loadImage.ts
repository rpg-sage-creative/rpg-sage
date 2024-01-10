import { Image, loadImage as _loadImage } from "@napi-rs/canvas";
import { errorReturnNull } from "../../ConsoleUtils";
import type { ImageMeta } from "../types";
import type { MapCache } from "./types";

/**
 * @private
 * Loads the image from the url, caching it for reuse.
 * If an error occurs while loading the image from url, we track the url.
*/
export async function loadImage(mapCache: MapCache, imgMeta: ImageMeta): Promise<Image | null> {
	const images = mapCache.images;
	const imageUrl = imgMeta.url;
	if (!images.has(imageUrl)) {
		const image = await _loadImage(imageUrl).catch(errorReturnNull);
		images.set(imageUrl, image);
		if (!image) {
			mapCache.invalidImageUrls.add(imageUrl);
		}
	}
	return images.get(imageUrl) ?? null;
}