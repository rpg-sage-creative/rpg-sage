import { SKRSContext2D, createCanvas } from "@napi-rs/canvas";
import { error, verbose } from "@rsc-utils/console-utils";
import { calculateValidClip } from "./calculateValidClip.js";
import { loadImage } from "./loadImage.js";
import type { MapCache } from "./types";

function drawLine(context: SKRSContext2D, x1: number, y1: number, x2: number, y2: number): void {
	context.beginPath();
	context.moveTo(x1, y1);
	context.lineTo(x2, y2);
	context.closePath();
	context.stroke();
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
	// mapCache.bgImage = bgImage;

	// get background image metadata
	const [bgClipX, bgClipY, bgWidth, bgHeight] = calculateValidClip(background, bgImage);

	// get grid cols, rows, color
	const gridCols = mapCache.mapData.grid?.[0] ?? 1;
	const gridRows = mapCache.mapData.grid?.[1] ?? 1;
	const gridColor = (mapCache.mapData.grid?.[2]?.match(/^#([a-f0-9]{3}){1,2}$/i) ?? [])[0];

	// create map pixel metadata
	const pxPerCol = bgWidth / gridCols;
	const pxPerRow = bgHeight / gridRows;
	mapCache.mapMeta = { pxPerCol, pxPerRow };

	// create canvas and context
	mapCache.context = createCanvas(bgWidth, bgHeight).getContext("2d");

	try {
		// draw the background
		mapCache.context.drawImage(bgImage, bgClipX, bgClipY, bgWidth, bgHeight, 0, 0, bgWidth, bgHeight);

		// draw the grid if a color was provided
		if (gridColor) {
			mapCache.context.strokeStyle = gridColor;
			for (let col = 0; col <= gridCols; col++) {
				const x = col * pxPerCol;
				drawLine(mapCache.context, x, 0, x, bgHeight);
			}
			for (let row = 0; row <= gridRows; row++) {
				const y = row * pxPerCol;
				drawLine(mapCache.context, 0, y, bgWidth, y);
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
