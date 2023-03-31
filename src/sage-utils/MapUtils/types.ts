
/** This object type has a clip rectangle. */
export type THasClip = {
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
export type THasNatural = {
	/** pixels on the x-axis */
	naturalWidth: number;

	/** pixels on the y-axis */
	naturalHeight: number;
}

/** This object has grid and pixel offsets. */
export type THasOffset = {
	/** offset from origin: [col, row] */
	gridOffset: [number, number];

	/** pixel offset from origin: [x, y] */
	pixelOffset: [number, number];
};

/** This object has opacity and url. */
export type TImageMeta = {
	/** opacity of image, from 0 to 1 */
	opacity?: number;

	/** url to the image */
	url: string;
};

export type TMapBackgroundImage = TImageMeta & Partial<THasClip>;

export type TMapLayerImage = TImageMeta & THasOffset & Partial<THasClip> & { size:[number, number]; };

export type TOrPromiseT<T> = T | PromiseLike<T>;

export interface IMapLayer {
	getImages(): TOrPromiseT<TMapLayerImage[]>;
	getOffset(): TOrPromiseT<Partial<THasOffset>>;
}

export interface IMap {
	getBackground(): TOrPromiseT<TMapBackgroundImage>;
	getGrid(): TOrPromiseT<[number, number]>;
	getLayers(): TOrPromiseT<IMapLayer[]>;
	toJSON(): TOrPromiseT<TMap>;
}

export type TMapLayer = {
	images: TMapLayerImage[];
	offset: Partial<THasOffset> | null;
};

export type TMap = {
	background: TMapBackgroundImage | null;
	grid: [number, number] | null;
	layers: TMapLayer[];
};
