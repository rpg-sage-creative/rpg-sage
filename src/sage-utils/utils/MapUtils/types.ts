
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

export type THasNatural = {
	/** pixels on the x-axis */
	naturalWidth: number;

	/** pixels on the y-axis */
	naturalHeight: number;
}

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

type TOrPromiseT<T> = T | PromiseLike<T>;

export interface IMapLayer {
	getImages(): TOrPromiseT<TMapLayerImage[]>;
	getOffset(): TOrPromiseT<Partial<THasOffset>>;
}

export interface IMap {
	getBackground(): TOrPromiseT<TMapBackgroundImage>;
	getGrid(): TOrPromiseT<[number, number]>;
	getLayers(): TOrPromiseT<IMapLayer[]>;
}

export type TMapLayer = {
	images: TMapLayerImage[];
	offset: Partial<THasOffset>;
}

export type TMap = {
	background: TMapBackgroundImage;
	grid: [number, number];
	layers: TMapLayer[];
}

export class RenderableMap implements IMap {
	public constructor(private map: TMap) { }
	public getBackground(): TOrPromiseT<TMapBackgroundImage> {
		return this.map.background;
	}
	public getGrid(): TOrPromiseT<[number, number]> {
		return this.map.grid;
	}
	public getLayers(): TOrPromiseT<IMapLayer[]> {
		return this.map.layers.map(RenderableMapLayer.from);
	}
	public static from(map: IMap | TMap): IMap {
		return "getBackground" in map ? map : new RenderableMap(map);
	}
}

export class RenderableMapLayer implements IMapLayer {
	public constructor(private mapLayer: TMapLayer) { }
	public getImages(): TOrPromiseT<TMapLayerImage[]> {
		return this.mapLayer.images;
	}
	public getOffset(): TOrPromiseT<Partial<THasOffset>> {
		return this.mapLayer.offset;
	}
	public static from(mapLayer: IMapLayer | TMapLayer) {
		return "getImages" in mapLayer ? mapLayer : new RenderableMapLayer(mapLayer);
	}
}
