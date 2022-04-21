import * as _canvas from "canvas";
const canvas: typeof _canvas = (_canvas as any).default;
import { errorReturnEmptyArray, errorReturnNull } from "../ConsoleUtils/Catchers";

export type THasClip = {
	/** x-axis pixels to start rendering from */
	clipX: number;
	/** y-axis pixels to start rendering from */
	clipY: number;
	/** total pixel width to render */
	clipWidth: number;
	/** total pixel height to render */
	clipHeight: number;
};
export type THasOffset = {
	/** offset from origin: [col, row] */
	gridOffset: [number, number];
	/** pixel offset from origin: [x, y] */
	pixelOffset: [number, number];
};

export type TImageMeta = {
	/** opacity of image, from 0 to 1 */
	opacity?: number;
	/** url to the image */
	url: string;
};
export type TMapBackgroundImage = TImageMeta & Partial<THasClip>;
export type TMapLayerImage = TImageMeta & THasOffset & Partial<THasClip> & { size:[number, number]; };
type TorPromiseT<T> = T | PromiseLike<T>;
export interface IMapLayer {
	getImages(): TorPromiseT<TMapLayerImage[]>;
	getOffset(): TorPromiseT<Partial<THasOffset>>;
}
export interface IMap {
	getBackground(): TorPromiseT<TMapBackgroundImage>;
	getGrid(): TorPromiseT<[number, number]>;
	getLayers(): TorPromiseT<IMapLayer[]>;
}

type mimeType = "image/png" | "image/jpeg";
/** returns an image/png Buffer */
export async function mapToBuffer(map: IMap, fileType: mimeType = "image/jpeg"): Promise<Buffer | null> {
	//#region get background meta or return null
	const bgMeta = await Promise.resolve(map.getBackground()).catch(errorReturnNull);
	if (!bgMeta) {
		return null;
	}
	//#endregion

	//#region load background image or return null
	const bgImage = await canvas.loadImage(bgMeta.url).catch(errorReturnNull);
	if (!bgImage) {
		return null;
	}
	//#endregion

	const bgClipX = bgMeta.clipX ?? 0,
		bgWidth = Math.min(bgMeta.clipWidth ?? bgImage.naturalWidth, bgImage.naturalWidth - bgClipX),
		bgClipY = bgMeta.clipY ?? 0,
		bgHeight = Math.min(bgMeta.clipHeight ?? bgImage.naturalHeight, bgImage.naturalHeight - bgClipY);

	const mapCanvas = canvas.createCanvas(bgWidth, bgHeight);
	const context = mapCanvas.getContext("2d");
	try {
		context.drawImage(bgImage, bgClipX, bgClipY, bgWidth, bgHeight, 0, 0, bgWidth, bgHeight);
	}catch(ex) {
		console.error(ex);
		return null;
	}

	//#region grid math
	const grid = await Promise.resolve(map.getGrid()).catch(errorReturnNull),
		cols = grid?.[0] ?? 1,
		pxPerCol = Math.floor(bgWidth / cols),
		rows = grid?.[1] ?? 1,
		pxPerRow = Math.floor(bgHeight / rows);
	//#endregion

	//#region render layers
	const layers: IMapLayer[] = await Promise.resolve(map.getLayers()).catch(errorReturnEmptyArray);
	for (const layer of layers) {
		await drawMapLayer(context, { pxPerCol, pxPerRow }, layer);
	}
	//#endregion

	return mapCanvas.toBuffer(fileType as "image/png");
}

/** Incoming map meta assumes grid origin of 1,1 not 0,0 */
function gridOffsetToZeroZero(offset?: [number, number]): [number, number] {
	const col = offset && offset[0] ? Math.max(offset[0] - 1, 0) : 0;
	const row = offset && offset[1] ? Math.max(offset[1] - 1, 0) : 0;
	return [col, row];
}

type TMapMeta = { pxPerCol:number; pxPerRow:number; };
async function drawMapLayer(context: _canvas.CanvasRenderingContext2D, mapMeta: TMapMeta, mapLayer: IMapLayer): Promise<void> {
	const images: TMapLayerImage[] = await Promise.resolve(mapLayer.getImages()).catch(errorReturnEmptyArray);
	if (images.length) {
		const layerOffset = await Promise.resolve(mapLayer.getOffset()).catch(errorReturnNull),
			gridOffset = gridOffsetToZeroZero(layerOffset?.gridOffset),
			layerOffsetX = layerOffset?.pixelOffset?.[0] ?? (gridOffset[0] * mapMeta.pxPerCol),
			layerOffsetY = layerOffset?.pixelOffset?.[1] ?? (gridOffset[1] * mapMeta.pxPerRow);

		for (const imgMeta of images) {
			await drawMapImage(context, { layerOffsetX, layerOffsetY, ...mapMeta }, imgMeta);
		}
	}
}

type TMapLayerMeta = TMapMeta & { layerOffsetX:number; layerOffsetY:number; };
async function drawMapImage(context: _canvas.CanvasRenderingContext2D, mapLayerMeta: TMapLayerMeta, mapLayerImage: TMapLayerImage): Promise<void> {
	const imgImage = await canvas.loadImage(mapLayerImage.url).catch(errorReturnNull);
	if (imgImage) {
		const gridOffset = gridOffsetToZeroZero(mapLayerImage.gridOffset),
			imgClipX = mapLayerImage.clipX ?? 0,
			imgClipWidth = Math.min(mapLayerImage.clipWidth ?? imgImage.naturalWidth, imgImage.naturalWidth - imgClipX),
			imgOffsetX = mapLayerImage.pixelOffset?.[0] ?? (gridOffset[0] * mapLayerMeta.pxPerCol),
			imgWidth = (mapLayerImage.size[0] ?? 1) * mapLayerMeta.pxPerCol,
			imgClipY = mapLayerImage.clipY ?? 0,
			imgClipHeight = Math.min(mapLayerImage.clipHeight ?? imgImage.naturalHeight, imgImage.naturalHeight - imgClipY),
			imgOffsetY = mapLayerImage.pixelOffset?.[1] ?? (gridOffset[1] * mapLayerMeta.pxPerRow),
			imgHeight = (mapLayerImage.size[1] ?? 1) * mapLayerMeta.pxPerRow,
			opacity = mapLayerImage.opacity ?? 1;
		try {
			context.globalAlpha = opacity;
			context.drawImage(imgImage, imgClipX, imgClipY, imgClipWidth, imgClipHeight, mapLayerMeta.layerOffsetX + imgOffsetX, mapLayerMeta.layerOffsetY + imgOffsetY, imgWidth, imgHeight);
		}catch(ex) {
			console.error(ex);
		}
	}
}
