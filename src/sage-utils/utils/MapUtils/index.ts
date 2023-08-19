import { Canvas, createCanvas, Image, loadImage, SKRSContext2D } from "@napi-rs/canvas";
import { errorReturnNull } from "../ConsoleUtils/Catchers";
// import { getBuffer } from "../HttpsUtils";
import type { IMap, IMapLayer, THasClip, THasNatural, TImageMeta, TMap, TMapBackgroundImage, TMapLayer, TMapLayerImage, TOrPromiseT } from "./types";

type mimeType = "image/png" | "image/jpeg" | "image/webp";

type TMapMeta = { pxPerCol:number; pxPerRow:number; };

type TMapArgs = {
	bgImage: Image,
	bgMeta: TMapBackgroundImage,
	canvas: Canvas,
	context: SKRSContext2D,
	images: Map<string, Image | null>,
	mapMeta: TMapMeta
};

async function _loadImage(mapArgs: TMapArgs, imgMeta: TImageMeta): Promise<Image | null> {
	if (!mapArgs.images.has(imgMeta.url)) {
		mapArgs.images.set(imgMeta.url, await loadImage(imgMeta.url).catch(errorReturnNull));
	}
	return mapArgs.images.get(imgMeta.url) ?? null;
}

type TCalcClip = [
	/** x */
	number,
	/** y */
	number,
	/** width */
	number,
	/** height */
	number
];
function calcClip(clip: Partial<THasClip>, natural: THasNatural): TCalcClip {
	//#region x
	const clipX = clip.clipX ?? 0;
	// calculate x from right (if negative) or left
	const cX = clipX < 0 ? natural.naturalWidth + clipX : clipX ?? 0;
	// check the boundaries
	const x = Math.min(Math.max(cX, 0), natural.naturalWidth - 1);
	//#endregion

	//#region width
	const clipWidth = clip.clipWidth ?? 0;
	// calculate clipWidth
	const cW = clipWidth < 0 ? natural.naturalWidth + clipWidth - x : clipWidth || natural.naturalWidth;
	// check the boundaries
	const w = Math.min(Math.max(cW, 0), natural.naturalWidth - x);
	//#endregion

	//#region y
	const clipY = clip.clipY ?? 0;
	// calculate y from top (if negative) or bottom
	const cY = clipY < 0 ? natural.naturalHeight + clipY : clipY ?? 0;
	// check the boundaries
	const y = Math.min(Math.max(cY, 0), natural.naturalHeight - 1);
	//#endregion

	//#region height
	const clipHeight = clip.clipHeight ?? 0;
	// calculate clipHeight
	const cH = clipHeight < 0 ? natural.naturalHeight + clipHeight - y : clipHeight || natural.naturalHeight;
	// check the boundaries
	const h = Math.min(Math.max(cH, 0), natural.naturalHeight - y);
	//#endregion

	return [x, y, w, h];
}

// function catchBufferFetch(err: any): null {
// 	if (String(err).includes("ECONNREFUSED")) {
// 		console.warn(`MapServer down, creating internally.`);
// 	}else {
// 		console.error(err);
// 	}
// 	return null;
// }

/** fetches and returns an image Buffer */
export async function iMapToBuffer(iMap: IMap, fileType?: mimeType): Promise<Buffer | null> {
	const tMap = await Promise.resolve(iMap.toJSON()).catch(errorReturnNull);
	if (tMap) {
		// const buffer = await getBuffer("http://localhost:3000", tMap).catch(catchBufferFetch);
		// if (buffer) return buffer;
		return tMapToBuffer(tMap, fileType);
	}
	return null;
}

/** creates and returns an image Buffer */
export async function tMapToBuffer(map: TMap, fileType: mimeType = "image/webp"): Promise<Buffer | null> {
	const mapArgs: TMapArgs = {
		bgImage: undefined!,
		bgMeta: undefined!,
		canvas: undefined!,
		context: undefined!,
		images: new Map(),
		mapMeta: undefined!
	};

	//#region get background meta or return null
	if (!map.background) {
		return null;
	}
	mapArgs.bgMeta = map.background;
	//#endregion

	//#region load background image or return null
	const bgImage = await _loadImage(mapArgs, map.background);
	if (!bgImage) {
		return null;
	}
	mapArgs.bgImage = bgImage;
	//#endregion

	const [bgClipX, bgClipY, bgWidth, bgHeight] = calcClip(map.background, bgImage);
	mapArgs.canvas = createCanvas(bgWidth, bgHeight);
	mapArgs.context = mapArgs.canvas.getContext("2d");

	try {
		mapArgs.context.drawImage(bgImage, bgClipX, bgClipY, bgWidth, bgHeight, 0, 0, bgWidth, bgHeight);
	}catch(ex) {
		console.error(ex);
		return null;
	}

	//#region grid math
	const grid = map.grid,
		cols = grid?.[0] ?? 1,
		pxPerCol = Math.floor(bgWidth / cols),
		rows = grid?.[1] ?? 1,
		pxPerRow = Math.floor(bgHeight / rows);
	mapArgs.mapMeta = { pxPerCol, pxPerRow };
	//#endregion

	//#region render layers
	const layers = map.layers;
	for (const layer of layers) {
		await drawMapLayer(mapArgs, layer);
	}
	//#endregion

	return mapArgs.canvas.toBuffer(fileType as "image/webp");
}

/** Incoming map meta assumes grid origin of 1,1 not 0,0 */
function gridOffsetToZeroZero(offset?: [number, number]): [number, number] {
	const col = offset && offset[0] ? Math.max(offset[0] - 1, 0) : 0;
	const row = offset && offset[1] ? Math.max(offset[1] - 1, 0) : 0;
	return [col, row];
}

async function drawMapLayer(mapArgs: TMapArgs, mapLayer: TMapLayer): Promise<void> {
	const images = mapLayer.images;
	if (images.length) {
		const layerOffset = mapLayer.offset,
			gridOffset = gridOffsetToZeroZero(layerOffset?.gridOffset),
			layerOffsetX = layerOffset?.pixelOffset?.[0] ?? (gridOffset[0] * mapArgs.mapMeta.pxPerCol),
			layerOffsetY = layerOffset?.pixelOffset?.[1] ?? (gridOffset[1] * mapArgs.mapMeta.pxPerRow);

		for (const imgMeta of images) {
			await drawMapImage(mapArgs, { layerOffsetX, layerOffsetY, ...mapArgs.mapMeta }, imgMeta);
		}
	}
}

type TMapLayerMeta = TMapMeta & { layerOffsetX:number; layerOffsetY:number; };
async function drawMapImage(mapArgs: TMapArgs, mapLayerMeta: TMapLayerMeta, mapLayerImage: TMapLayerImage): Promise<void> {
	const imgImage = await _loadImage(mapArgs, mapLayerImage);
	if (imgImage) {
		const [imgClipX, imgClipY, imgClipWidth, imgClipHeight] = calcClip(mapLayerImage, imgImage),
			gridOffset = gridOffsetToZeroZero(mapLayerImage.gridOffset),
			imgOffsetX = mapLayerImage.pixelOffset?.[0] ?? (gridOffset[0] * mapLayerMeta.pxPerCol),
			imgWidth = (mapLayerImage.size[0] ?? 1) * mapLayerMeta.pxPerCol,
			imgOffsetY = mapLayerImage.pixelOffset?.[1] ?? (gridOffset[1] * mapLayerMeta.pxPerRow),
			imgHeight = (mapLayerImage.size[1] ?? 1) * mapLayerMeta.pxPerRow,
			opacity = mapLayerImage.opacity ?? 1;
		try {
			mapArgs.context.globalAlpha = opacity;
			mapArgs.context.drawImage(imgImage, imgClipX, imgClipY, imgClipWidth, imgClipHeight, mapLayerMeta.layerOffsetX + imgOffsetX, mapLayerMeta.layerOffsetY + imgOffsetY, imgWidth, imgHeight);
		}catch(ex) {
			console.error(ex);
		}
	}
}

export abstract class RenderableMap implements IMap {
	abstract getBackground(): TOrPromiseT<TMapBackgroundImage>;
	abstract getGrid(): TOrPromiseT<[number, number]>;
	abstract getLayers(): TOrPromiseT<IMapLayer[]>;
	public render(): Promise<Buffer | null> {
		return iMapToBuffer(this).catch(errorReturnNull);
	}
	abstract toJSON(): TOrPromiseT<TMap>;
}
