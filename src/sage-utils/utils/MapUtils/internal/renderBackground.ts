import { createCanvas } from "@napi-rs/canvas";
import { error, verbose } from "../../ConsoleUtils";
import { calculateValidClip } from "./calculateValidClip.js";
import { loadImage } from "./loadImage.js";
import { renderSquareGrid } from "./renderSquareGrid";
import type { MapCache } from "./types";

function parseGridType(gridType?: string): "square" | "hex" {
	const lower = gridType?.toLowerCase();
	return ["square", "hex"].find(type => type === lower) as "square" ?? "square";
}

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

	// get background image metadata
	const [bgClipX, bgClipY, bgWidth, bgHeight] = calculateValidClip(background, bgImage);

	// get grid cols, rows, color
	const cols = mapCache.mapData.grid?.[0] ?? 1;
	const rows = mapCache.mapData.grid?.[1] ?? 1;
	const strokeStyle = (mapCache.mapData.grid?.[2]?.match(/^#([a-f0-9]{3}){1,2}$/i) ?? [])[0];
	const gridType = parseGridType(mapCache.mapData.grid?.[3]);

	// create map pixel metadata
	const pxPerCol = bgWidth / cols;
	const pxPerRow = bgHeight / rows;
	mapCache.mapMeta = { pxPerCol, pxPerRow };

	// create canvas and context
	mapCache.context = createCanvas(bgWidth, bgHeight).getContext("2d");

	try {
		// draw the background
		mapCache.context.drawImage(bgImage, bgClipX, bgClipY, bgWidth, bgHeight, 0, 0, bgWidth, bgHeight);

		// draw the grid if a color was provided
		if (strokeStyle) {
			if (gridType === "hex") {

			}else {
				renderSquareGrid(mapCache.context, { strokeStyle, cols, rows, pxPerCol, pxPerRow });
			}
		}

		return true;

	}catch(ex) {
		verbose(`mapArgs.context.drawImage(bgImage = ${JSON.stringify(background)}, ${bgClipX}, ${bgClipY}, ${bgWidth}, ${bgHeight}, 0, 0, ${bgWidth}, ${bgHeight});`);
		error(ex);
		// remember the bad url
		mapCache.invalidImages.add(background.url);
		return false;
	}
}
