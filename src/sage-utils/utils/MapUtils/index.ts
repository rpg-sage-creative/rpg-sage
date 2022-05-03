import * as _canvas from "canvas";
const canvas: typeof _canvas = (_canvas as any).default;
import { errorReturnEmptyArray, errorReturnNull } from "../ConsoleUtils/Catchers";
import type { IMap, IMapLayer, THasClip, THasNatural, TImageMeta, TMapBackgroundImage, TMapLayerImage } from "./types";

type mimeType = "image/png" | "image/jpeg";

type TMapMeta = { pxPerCol:number; pxPerRow:number; };

type TMapArgs = {
	bgImage: _canvas.Image,
	bgMeta: TMapBackgroundImage,
	canvas: _canvas.Canvas,
	context: _canvas.CanvasRenderingContext2D,
	images: Map<string, _canvas.Image | null>,
	mapMeta: TMapMeta
};

async function loadImage(mapArgs: TMapArgs, imgMeta: TImageMeta): Promise<_canvas.Image | null> {
	if (!mapArgs.images.has(imgMeta.url)) {
		mapArgs.images.set(imgMeta.url, await canvas.loadImage(imgMeta.url).catch(errorReturnNull));
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
	const cW = clipWidth < 0 ? natural.naturalWidth + clipWidth - x : clipWidth ?? natural.naturalWidth;
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
	const cH = clipHeight < 0 ? natural.naturalHeight + clipHeight - y : clipHeight ?? natural.naturalHeight;
	// check the boundaries
	const h = Math.min(Math.max(cH, 0), natural.naturalHeight - y);
	//#endregion

	return [x, y, w, h];
}

/** returns an image/png Buffer */
export async function mapToBuffer(map: IMap, fileType: mimeType = "image/jpeg"): Promise<Buffer | null> {
	const mapArgs: TMapArgs = {
		bgImage: undefined!,
		bgMeta: undefined!,
		canvas: undefined!,
		context: undefined!,
		images: new Map(),
		mapMeta: undefined!
	};

	//#region get background meta or return null
	const bgMeta = await Promise.resolve(map.getBackground()).catch(errorReturnNull);
	if (!bgMeta) {
		return null;
	}
	mapArgs.bgMeta = bgMeta;
	//#endregion

	//#region load background image or return null
	const bgImage = await loadImage(mapArgs, bgMeta);
	if (!bgImage) {
		return null;
	}
	//#endregion

	const [bgClipX, bgClipY, bgWidth, bgHeight] = calcClip(bgMeta, bgImage);
	mapArgs.canvas = canvas.createCanvas(bgWidth, bgHeight);
	mapArgs.context = mapArgs.canvas.getContext("2d");

	try {
		mapArgs.context.drawImage(bgImage, bgClipX, bgClipY, bgWidth, bgHeight, 0, 0, bgWidth, bgHeight);
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
	mapArgs.mapMeta = { pxPerCol, pxPerRow };
	//#endregion

	//#region render layers
	const layers: IMapLayer[] = await Promise.resolve(map.getLayers()).catch(errorReturnEmptyArray);
	for (const layer of layers) {
		await drawMapLayer(mapArgs, layer);
	}
	//#endregion

	return mapArgs.canvas.toBuffer(fileType as "image/png");
}

/** Incoming map meta assumes grid origin of 1,1 not 0,0 */
function gridOffsetToZeroZero(offset?: [number, number]): [number, number] {
	const col = offset && offset[0] ? Math.max(offset[0] - 1, 0) : 0;
	const row = offset && offset[1] ? Math.max(offset[1] - 1, 0) : 0;
	return [col, row];
}

async function drawMapLayer(mapArgs: TMapArgs, mapLayer: IMapLayer): Promise<void> {
	const images: TMapLayerImage[] = await Promise.resolve(mapLayer.getImages()).catch(errorReturnEmptyArray);
	if (images.length) {
		const layerOffset = await Promise.resolve(mapLayer.getOffset()).catch(errorReturnNull),
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
	const imgImage = await loadImage(mapArgs, mapLayerImage);
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
