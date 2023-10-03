import type { Image, SKRSContext2D } from "@napi-rs/canvas";
import type { GameMapData, MimeType } from "../types";

export type MapMeta = {
	pxPerCol: number;
	pxPerRow: number;
};

export type MapLayerMeta = MapMeta & {
	layerOffsetX: number;
	layerOffsetY: number;
};

/**
 * This object represents all the data we collect while creating a rendered image.
 * We collect/cache it in a single object that gets passed around so that we can avoid duplication.
 * It also gives us a single object we can use to try and clean up memory usage.
*/
export type MapCache = {
	context: SKRSContext2D;
	images: Map<string, Image | null>;
	invalidImages: Set<string>;
	invalidImageUrls: Set<string>;
	mapData: GameMapData;
	mapMeta: MapMeta;
	mimeType: MimeType;
};

/**
 * A valid clip region.
 * Returned from calculateValidClip.
 */
export type ValidClip = [
	/** x */
	number,
	/** y */
	number,
	/** width */
	number,
	/** height */
	number
];