import type { Awaitable } from "../..";

export type NumberPair = [number, number];

export type NumberQuartet = [number, number, number, number];

export type MimeType = "image/png" | "image/jpeg" | "image/webp";

/** This object type has a clip rectangle. */
export type HasClip = {
	/** x-axis pixels to start rendering from */
	clipX: number;

	/** y-axis pixels to start rendering from */
	clipY: number;

	/** total pixel width to render; a negative number clips that many pixels off the end of the x-axis */
	clipWidth: number;

	/** total pixel height to render a negative number clips that many pixels off the end of the y-axis */
	clipHeight: number;
};

/** This object has natural height and width. */
export type HasNatural = {
	/** pixels on the x-axis */
	naturalWidth: number;

	/** pixels on the y-axis */
	naturalHeight: number;
}

/** This object has grid and pixel offsets. */
export type HasOffset = {
	/** offset from origin: [col, row] */
	gridOffset: NumberPair;

	/** pixel offset from origin: [x, y] */
	pixelOffset: NumberPair;
};

export type HasSize = {
	size: NumberPair;
}

/** This object has opacity and url. */
export type ImageMeta = {
	/** opacity of image, from 0 to 1 */
	opacity?: number;

	/** for token art that bleeds over their token/base */
	scale?: number;

	/** url to the image */
	url: string;
};

export type GameMapLayerImage = ImageMeta & Partial<HasClip> & HasOffset & HasSize;

export type GameMapBackgroundImage = ImageMeta & Partial<HasClip>;

//#region GameLayer

export type GameMapLayerData = {
	images: GameMapLayerImage[];
	offset: Partial<HasOffset> | null;
};

export interface GameMapLayer {
	getImages(): Awaitable<GameMapLayerImage[]>;
	getOffset(): Awaitable<Partial<HasOffset>>;
}

//#endregion

//#region GameMap

type GridCols = number;
type GridRows = number;
type GridStrokeStyle = string | undefined;
type GridType = "square" | "vhex" | "hex" | undefined;
export type GameGridData = [GridCols, GridRows, GridStrokeStyle, GridType];

export type GameMapData = {
	background: GameMapBackgroundImage | null;
	grid: GameGridData | null;
	layers: GameMapLayerData[];
};

export interface GameMap {
	getBackground(): Awaitable<GameMapBackgroundImage>;
	getGrid(): Awaitable<GameGridData>;
	getLayers(): Awaitable<GameMapLayer[]>;
	toJSON(): Awaitable<GameMapData>;
}

//#endregion

//#region Render

export type MapRenderPayload = {
	/** The map data to render. */
	mapData: GameMapData;

	/** The desired mimeType of the output image. */
	mimeType: MimeType;
};

export type MapRenderResponse = {
	/** The image's Buffer as a base64 string */
	base64?: string | null;

	/** A list of image urls that couldn't be drawn. */
	invalidImages: string[];

	/** A list of image urls that couldn't be loaded. */
	invalidImageUrls: string[];

	/** The map data originally given. */
	mapData: GameMapData;

	/** The mime type originally given. */
	mimeType: MimeType;
};

//#endregion
