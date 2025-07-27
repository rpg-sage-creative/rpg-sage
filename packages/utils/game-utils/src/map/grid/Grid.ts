import { createCanvas, type Image, type SKRSContext2D } from "@napi-rs/canvas";
import { uncache } from "@rsc-utils/core-utils";
import { isVisibleColor, type HexColorString } from "@rsc-utils/core-utils";
import { Coord, type CoordResolvable } from "../Coord.js";
import type { CompassDirection } from "../types/CompassDirection.js";
import type { GridArgs } from "../types/GridArgs.js";
import type { GridCoordinate } from "../types/GridCoordinate.js";
import type { GridType } from "../types/GridType.js";
import type { HasPixelDimensions } from "../types/HasDimensions.js";
import type { HasGridDimensions } from "../types/HasGridDimensions.js";
import type { HasPxPer } from "../types/HasPxPer.js";
import type { MimeType } from "../types/MimeType.js";
import { GridTile } from "./GridTile.js";
import { drawImage, type DrawImageArgs, type DrawImageMeta } from "./drawImage.js";
import { drawTile, type DrawArgs } from "./drawTile.js";
import { drawToken, type DrawTokenArgs, type DrawTokenMeta } from "./drawToken.js";
import { fillTile, type FillArgs } from "./fillTile.js";

export type GridCore = HasPixelDimensions & HasGridDimensions & {
	context: SKRSContext2D;

	dX: number;
	dY: number;

	/** square, flat (hex), pointy (hex) */
	gridType: GridType;
	/** hex value, defaults to #000 */
	gridColor?: HexColorString;
	gridWidth?: number;

	/** width of tile in pixels */
	tileWidth: number;
	/** height of tile in pixels */
	tileHeight: number;

	/** show column key */
	colKey: boolean;
	/** show row key */
	rowKey: boolean;

	/** multiplier used to scale the size of the column keys */
	colKeyScale: number;
	/** multiplier used to scale the size of the row keys */
	rowKeyScale: number;
};

type BufferOptions = {
	mimeType?: MimeType;
};

type PathArgs = CoordResolvable & {
	path: CompassDirection[];
};

type DrawKeysArgs = FillArgs & {
	bgImage?: Image;
};

export class Grid {
	// allow a background layer made up of tiled images
	// add a createBackgroundImage function for caching (includes all background images)
	// add a createTerrainImage function for caching (includes all background and terrain)
	// add a createMoveImage function for caching (includes all background and terrain and tokens not being moved)

	protected core: GridCore;

	public constructor(args: GridArgs, _context?: SKRSContext2D) {
		let { width, height, cols, rows, gridColor, gridType, gridWidth, keys, colKey, rowKey, keyScale, colKeyScale, rowKeyScale } = args;
		colKey = colKey ?? keys ?? false;
		rowKey = rowKey ?? keys ?? false;
		colKeyScale = colKeyScale ?? keyScale ?? 1;
		rowKeyScale = rowKeyScale ?? keyScale ?? 1;
		const tileWidth = width / cols;
		const tileHeight = height / rows;
		const dX = rowKey ? tileWidth * rowKeyScale : 0;
		const dY = colKey ? tileHeight * colKeyScale : 0;
		const context = _context ?? createCanvas(width + dX, height + dY).getContext("2d");
		this.core = { context, dX, dY, width, height, cols, rows, tileWidth, tileHeight, gridColor, gridType, gridWidth, colKey, rowKey, colKeyScale, rowKeyScale };
	}

	public get pxPerCol(): number { return this.core.tileWidth; }
	public get pxPerRow(): number { return this.core.tileHeight; }

	public clone(): Grid {
		return new Grid(this.core);
	}

	public get context(): SKRSContext2D { return this.core.context; }

	/** Adjustment on the x-axis due to presence of a rowKey. */
	public get dX(): number { return this.core.dX; }

	/** Adjustment on the y-axis due to presence of a colKey. */
	public get dY(): number { return this.core.dY; }

	public get colKey(): boolean { return this.core.colKey; }
	public get rowKey(): boolean { return this.core.rowKey; }
	public get keys(): boolean { return this.colKey || this.rowKey; }

	public get height(): number { return this.core.height; }
	public get width(): number { return this.core.width; }

	public destroy(): void {
		this.core = uncache(this.core)!;
	}

	//#region drawTile/Path

	protected getDrawArgs(args?: DrawArgs): DrawArgs {
		// missing from core: strokeAlpha
		const defArgs = { context:this.core.context, dX:this.dX, dY:this.dY, lineWidth:this.core.gridWidth, strokeStyle:this.core.gridColor };
		return { ...defArgs, ...args };
	}

	/**
	 * Draws the tile at the given coordinates.
	 * Passing options allows you to bypass getting dX/dY/strokeStyle when running in a loop; such as in drawGrid.
	 */
	public drawTile(coord: CoordResolvable, args?: DrawArgs): void {
		drawTile(this.get(coord), this.getDrawArgs(args));
	}

	public drawTilePath(path: PathArgs, args?: DrawArgs): void {
		const drawArgs = this.getDrawArgs(args);
		this.getPathTiles(path).forEach(tile => drawTile(tile, drawArgs));
	}

	//#endregion

	/** Draws all the tiles visible on the grid. */
	public drawGrid(args?: DrawArgs): void {
		// if we are given a 0 alpha, then we can't see it no matter the color
		if (args?.strokeAlpha === 0) return; // NOSONAR

		const color = args?.strokeStyle ?? this.core.gridColor;
		// if we are given no color, then we are using a default color that has alpha of 1.0
		const visible = !color || isVisibleColor(color);

		// if we can't see it, don't draw it
		if (!visible) return; // NOSONAR

		const drawArgs = this.getDrawArgs(args);
		for (let col = 1; this.isVisible({col}); col++) {
			for (let row = 1; this.isVisible({row}); row++) {
				// by passing in { context, dX, dY, strokeStyle }, we are saving clock cycles by calculating them only one time per render
				drawTile(this.get({ col, row }), drawArgs);
			}
		}
	}

	protected getDrawImageArgs(args?: DrawImageArgs): DrawImageArgs {
		const defArgs = { context:this.core.context, dX:this.dX, dY:this.dY, tileHeight:this.core.tileHeight, tileWidth:this.core.tileWidth };
		return { ...defArgs, ...args };
	}

	/** For simple image drawing. If you need complicated image manipulation, you are looking for drawMapImage. */
	public drawImage(coord: CoordResolvable, imageMeta: DrawImageMeta, args?: DrawImageArgs): void {
		drawImage(this.get(coord), imageMeta, this.getDrawImageArgs(args));
	}

	public drawImagePath(path: PathArgs, imageMeta: DrawImageMeta, args?: DrawImageArgs): void {
		const tiles = this.getPathTiles(path);
		const drawImageArgs = this.getDrawImageArgs(args);
		const alphaDelta = 1 / tiles.length;
		tiles.forEach((tile, index) => {
			const alpha = 0.6 + 0.4 * index * alphaDelta;
			drawImage(tile, imageMeta, { ...drawImageArgs, alpha });
		});
	}

	/** Draws the col/row keys as specified. */
	public drawKeys(args?: DrawKeysArgs): void {
		if (!this.core.colKey && !this.core.rowKey) return;

		const context = args?.context ?? this.core.context;
		if (!context) throw new TypeError(`Invalid DrawKeysArgs: missing "context"!`);

		const { colKey, rowKey } = this.core;
		if (!colKey && !rowKey) return; // NOSONAR

		const { fillAlpha = 0.7, bgImage, fillStyle = "#000", strokeStyle = "#fff" } = args ?? { };
		const { width, height, tileWidth, tileHeight, colKeyScale, rowKeyScale } = this.core;
		const { dX, dY } = this;

		//#region drawImage

		if (bgImage) {
			// use pixel 0,0 to fill in the top left corner
			if (colKey && rowKey) {
				context.drawImage(bgImage, 0, 0, 1, 1, 0, 0, dX, dY);
			}

			// use first horizontal pixel to fill in col keys
			if (colKey) {
				const adjustedX = rowKey ? tileWidth * rowKeyScale : 0;
				context.drawImage(bgImage, 0, 0, width, 1, adjustedX, 0, width, dY);
			}

			// use first vertical pixel to fill in row keys
			if (rowKey) {
				const adjustedY = colKey ? tileHeight * colKeyScale : 0;
				context.drawImage(bgImage, 0, 0, 1, height, 0, adjustedY, dX, height);
			}

		}

		//#endregion

		//#region fillRect

		context.save();
		context.globalAlpha = fillAlpha;
		context.fillStyle = fillStyle;

		/** Fill these 3 pieces separately to avoid making the upper left corner darker. */

		// fill upper left/corner
		if (colKey && rowKey) {
			context.fillRect(0, 0, dX, dY);
		}

		// fill behind col keys
		if (colKey) {
			context.fillRect(dX, 0, width, dY);
		}

		// fill behind row keys
		if (rowKey) {
			context.fillRect(0, dY, dX, height);
		}

		context.restore();

		//#endregion

		//#region text

		context.save();
		context.fillStyle = strokeStyle;
		context.strokeStyle = strokeStyle;
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.font = `${Math.min(tileWidth, tileHeight) * 0.33}px serif`;

		if (colKey) {
			for (let col = 1; this.isVisible({ col }); col++) {
				const centerX = this.get({ col, row:1 }).center.x;
				// move up from center
				const mY = 0.5 * colKeyScale;
				context.fillText(Coord.from(col, 1).colKey, centerX + dX, tileHeight * mY, tileWidth);
			}
		}
		if (rowKey) {
			for (let row = 1; this.isVisible({ row }); row++) {
				const centerY = this.get({ col:1, row }).center.y;
				// move left from center
				const mX = 0.5 * rowKeyScale;
				context.fillText(String(row), tileWidth * mX, centerY + dY, tileWidth);
			}
		}

		context.restore();

		//#endregion

	}

	protected getDrawTokenArgs(args?: DrawTokenArgs): HasPxPer & DrawTokenArgs {
		const defArgs = { context:this.core.context, dX:this.dX, dY:this.dY, pxPerCol:this.pxPerCol, pxPerRow:this.pxPerRow };
		return { ...defArgs, ...args };
	}

	public drawToken(coord: CoordResolvable, tokenMeta: DrawTokenMeta, args?: DrawTokenArgs): void {
		drawToken(this.get(coord), tokenMeta, this.getDrawTokenArgs(args));
	}

	public drawTokenPath(path: PathArgs, tokenMeta: DrawTokenMeta, args?: DrawTokenArgs): void;
	public drawTokenPath(paths: PathArgs[], tokenMeta: DrawTokenMeta, args?: DrawTokenArgs): void;
	public drawTokenPath(pathOrPaths: PathArgs | PathArgs[], tokenMeta: DrawTokenMeta, args?: DrawTokenArgs): void {
		const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths];
		const tiles = paths.reduce((out, path) => out.concat(this.getPathTiles(path)), [] as GridTile[]);
		const drawTokenArgs = this.getDrawTokenArgs(args);
		const alphaDelta = 1 / tiles.length;
		tiles.forEach((tile, index) => {
			const alpha = 0.6 + 0.4 * index * alphaDelta;
			drawToken(tile, tokenMeta, { ...drawTokenArgs, alpha });
		});
	}
	//#region fillTile/Path

	protected getFillArgs(args?: FillArgs): FillArgs {
		// missing from core: fillAlpha, fillStyle, strokeAlpha
		const defArgs = {
			context: this.core.context,
			dX: this.dX,
			dY: this.dY,
			fillStyle: this.core.gridColor,
			strokeStyle: args?.fillStyle ?? this.core.gridColor
		};
		return { ...defArgs, ...args };
	}

	/**
	 * Fills the tile at the given coordinates.
	 * Passing options allows you to bypass getting dX/dY/fillStyle when running in a loop; such as in drawPath
	 */
	public fillTile(coord: CoordResolvable, args?: FillArgs) {
		fillTile(this.get(coord), this.getFillArgs(args));
	}

	public fillTilePath(path: PathArgs, args?: FillArgs) {
		const tiles = this.getPathTiles(path);
		const fillArgs = this.getFillArgs(args);
		const alphaDelta = 1 / tiles.length;
		tiles.forEach((tile, index) => {
			const fillAlpha = 0.25 + 0.5 * index * alphaDelta;
			fillTile(tile, { ...fillArgs, fillAlpha });
		});
	}

	//#endregion

	public getPathTiles(args: PathArgs): GridTile[] {
		const tiles = [];
		tiles.push(this.get(args));
		for (const dir of args.path) {
			tiles.push(tiles[tiles.length - 1].move({ dir }));
		}
		return tiles;
	}

	/** Returns the GridTile for the given coordinate. */
	public get(coord: CoordResolvable): GridTile {
		const { col, row } = Coord.toGridTileCoordinate(coord);
		const [width, height, gridType] = [this.core.tileWidth, this.core.tileHeight, this.core.gridType];
		return new GridTile({ col, row, width, height, gridType });
	}

	// /** Is the given col/row/coord within the expected columns and rows. */
	// public has({ col = 1, row = 1 }: Partial<GridCoordinate> = { }): boolean {
	// 	return col > 0 && col <= this.core.cols && row > 0 && row <= this.core.rows;
	// }

	/**
	 * Is the coordinate visible on the map?
	 * Allows for partial hex tiles.
	 */
	public isVisible({ col = 1, row = 1 }: Partial<GridCoordinate> = { }): boolean {
		const tile = this.get({ col, row });
		const least = tile.least;
		if (least.x >= 0 && least.y >= 0) {
			return least.x < this.core.width + this.dX && least.y < this.core.height + this.dY;
		}
		const most = tile.most;
		return most.x > 0 && most.y > 0;
	}

	/** Returns a Buffer if the Grid has a context. */
	public toBuffer(options?: BufferOptions): Buffer | undefined {
		const mimeType = options?.mimeType as "image/webp" ?? "image/webp";
		return this.core.context?.canvas.toBuffer(mimeType);
	}
}
