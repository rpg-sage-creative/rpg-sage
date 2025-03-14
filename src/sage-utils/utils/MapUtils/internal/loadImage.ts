import { Image, loadImage as _loadImage } from "@napi-rs/canvas";
import { error, warn } from "@rsc-utils/core-utils";
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
		// first fetch
		let image = await _loadImage(imageUrl).catch(err => {
			warn({ imageUrl }, err);
			return null;
		});

		// if we failed, try again just in case
		if (!image) {
			image = await _loadImage(imageUrl).catch(err => {
				error({ imageUrl }, err);
				return null;
			});
		}

		// store that we go it (or tried to)
		images.set(imageUrl, image);
		if (!image) {
			// track that it failed
			mapCache.invalidImageUrls.add(imageUrl);
		}
	}
	return images.get(imageUrl) ?? null;
}