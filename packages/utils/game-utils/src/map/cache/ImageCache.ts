// import type { Image } from "@napi-rs/canvas";
import type { Snowflake } from "@rsc-utils/core-utils";
import type { ImageMeta } from "./ImageMeta.js";

export type ImageCache = {
	/**
	 * Where the file is stored locally.
	 * Set when an image is cached.
	 * Null if there was an error trying to cache.
	 */
	cachePath?: string | null;

	/**
	 * The image loaded in memory.
	 * Null if there was an error trying to load.
	 */
	//image?: Image | null;

	imageId: Snowflake;

	/**
	 * Image meta data.
	 * Null if there was an error parsing meta data.
	 */
	imageMeta?: ImageMeta | null;

	/**
	 * Url to the original image.
	 */
	url: string;
};
