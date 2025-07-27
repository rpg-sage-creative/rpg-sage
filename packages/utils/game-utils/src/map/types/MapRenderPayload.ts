import type { GameMapData } from "./GameMapData.js";
import type { MimeType } from "./MimeType.js";

export type MapRenderPayload = {
	/** The map data to render. */
	mapData: GameMapData;

	/** The desired mimeType of the output image. */
	mimeType: MimeType;
};
