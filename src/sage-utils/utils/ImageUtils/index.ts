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

export type TMapMeta = { cols:number; rows:number; tokens:TTokenMeta[]; url:string; };
export type TTokenMeta = { cols:number; rows:number; x:number; y:number; url:string; };

type mimeType = "image/png" | "image/jpeg";
/** returns an image/png Buffer */
export async function mapToBuffer(map: TMapMeta, fileType: mimeType = "image/jpeg"): Promise<Buffer | null> {
	const mapImage = await canvas.loadImage(map.url).catch(errorReturnNull);
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

	for (const token of map.tokens) {
		const tokenImage = await canvas.loadImage(token.url).catch(errorReturnNull);
		if (tokenImage) {
			const tokenWidth = (token.cols ?? 1) * pxPerCol;
			const tokenHeight = (token.rows ?? 1) * pxPerRow;
			const tokenX = (token.x ?? 0) * pxPerCol;
			const tokenY = (token.y ?? 0) * pxPerRow;
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
