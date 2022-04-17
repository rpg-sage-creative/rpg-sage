import * as fs from "fs";
import { getProtocol } from "../HttpsUtils";
import * as _canvas from "canvas";
const canvas: typeof _canvas = (_canvas as any).default;
import { errorReturnNull } from "../ConsoleUtils/Catchers";

export function downloadImage(url: string, filePath: string): Promise<boolean> {
	const protocol = getProtocol(url);
	return new Promise((resolve, reject) => {
		protocol.get(url, res => {
			if (res.statusCode === 200) {
				if (!fs.existsSync(filePath)) {
					fs.mkdirSync(filePath, { recursive:true });
					fs.rmdirSync(filePath);
				}
				res.pipe(fs.createWriteStream(filePath))
					.on('error', reject)
					.once('close', () => resolve(true));
			} else {
				// Consume response data to free up memory
				res.resume();
				reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

			}
		});
	});
}

export type TMapMeta = { filePath:string; cols:number; rows:number; };
export type TTokenMeta = { filePath:string; cols:number; rows:number; x:number; y:number; };

/** returns an image/png Buffer */
export async function renderMap(map: TMapMeta, tokens: TTokenMeta[], fileType = "image/png"): Promise<Buffer | null> {
	const mapImage = await canvas.loadImage(map.filePath).catch(errorReturnNull);
	if (!mapImage) {
		return null;
	}

	const pxPerCol = Math.floor(mapImage.naturalWidth / map.cols);
	const pxPerRow = Math.floor(mapImage.naturalHeight / map.rows);
	const mapCanvas = canvas.createCanvas(mapImage.naturalWidth, mapImage.naturalHeight);
	const context = mapCanvas.getContext("2d");
	try {
		context.drawImage(mapImage, 0, 0);
	}catch(ex) {
		console.error(ex);
		return null;
	}

	for (const token of tokens) {
		const tokenImage = await canvas.loadImage(token.filePath).catch(errorReturnNull);
		if (tokenImage) {
			const tokenWidth = token.cols * pxPerCol;
			const tokenHeight = token.rows * pxPerRow;
			const tokenX = token.x * pxPerCol;
			const tokenY = token.y * pxPerRow;
			try {
				context.drawImage(tokenImage, tokenX, tokenY, tokenWidth, tokenHeight);
			}catch(ex) {
				console.error(ex);
				return null;
			}
		}
	}

	return mapCanvas.toBuffer(fileType as "image/png");
}
