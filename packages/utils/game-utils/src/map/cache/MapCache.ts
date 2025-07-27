import type { Grid } from "../grid/Grid.js";
import type { GameMapData } from "../types/GameMapData.js";
import type { MimeType } from "../types/MimeType.js";
import type { ImageCache } from "./ImageCache.js";
import type { MapMeta } from "./MapMeta.js";

/**
 * This object represents all the data we collect while creating a rendered image.
 * We collect/cache it in a single object that gets passed around so that we can avoid duplication.
 * It also gives us a single object we can use to try and clean up memory usage.
*/
export type MapCache = {
	grid: Grid;
	images: Map<string, ImageCache | null>;
	invalidImages: Set<string>;
	invalidImageUrls: Set<string>;
	mapData: GameMapData;
	mapMeta: MapMeta;
	mimeType: MimeType;
};
