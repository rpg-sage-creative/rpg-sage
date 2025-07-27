import type { GameMapData } from "./GameMapData.js";
import type { MimeType } from "./MimeType.js";

export type MapRenderResponse = {
	/** The image's Buffer as a base64 string */
	base64: string | undefined;

	/** A list of image urls that couldn't be drawn. */
	invalidImages: string[];

	/** A list of image urls that couldn't be loaded. */
	invalidImageUrls: string[];

	/** The map data originally given. */
	mapData: GameMapData;

	/** The mime type originally given. */
	mimeType: MimeType;
};

