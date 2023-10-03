import { createCanvas } from "@napi-rs/canvas";
import { error, verbose } from "../../ConsoleUtils";
import { calculateValidClip } from "./calculateValidClip.js";
import { loadImage } from "./loadImage.js";
import type { MapCache } from "./types";

/**
 * @private
 * Attempts to render the map's background.
 * Returns true if successful, false otherwise.
*/
export async function renderBackground(mapCache: MapCache): Promise<boolean> {
	const background = mapCache.mapData.background;

	// ensure the map data has a background
	if (!background) {
		verbose(`!GameMapData.background`, mapCache.mapData);
		return false;
	}

	// load the background image
	const bgImage = await loadImage(mapCache, background);
	if (!bgImage) {
		verbose(`!bgImage`, background);
		return false;
	}
	// mapCache.bgImage = bgImage;

	// get background image metadata
	const [bgClipX, bgClipY, bgWidth, bgHeight] = calculateValidClip(background, bgImage);

	// create map pixel metadata
	mapCache.mapMeta = {
		pxPerCol: Math.floor(bgWidth / (mapCache.mapData.grid?.[0] ?? 1)),
		pxPerRow: Math.floor(bgHeight / (mapCache.mapData.grid?.[1] ?? 1))
	};

	// create canvas and context
	mapCache.context = createCanvas(bgWidth, bgHeight).getContext("2d");

	try {
		// draw the background
		mapCache.context.drawImage(bgImage, bgClipX, bgClipY, bgWidth, bgHeight, 0, 0, bgWidth, bgHeight);
		return true;

	}catch(ex) {
		verbose(`mapArgs.context.drawImage(bgImage = ${JSON.stringify(background)}, ${bgClipX}, ${bgClipY}, ${bgWidth}, ${bgHeight}, 0, 0, ${bgWidth}, ${bgHeight});`);
		error(ex);
		// remember the bad url
		mapCache.invalidImages.add(background.url);
		return false;
	}
}
