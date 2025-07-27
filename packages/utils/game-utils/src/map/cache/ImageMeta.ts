import type { GridCoordinate } from "../types/GridCoordinate.js";
import type { HasClip } from "../types/HasClip.js";
import type { HasPixelDimensions } from "../types/HasDimensions.js";
import type { HasGridDimensions } from "../types/HasGridDimensions.js";
import type { HasScale } from "../types/HasScale.js";
import type { Point } from "../types/Point.js";

export type ScaleMeta = Omit<HasScale, "scale">;

// col, row, cols, rows
export type GridRect = HasGridDimensions & GridCoordinate;

// x, y, width, height
export type PixelRect = HasPixelDimensions & Point;

type BaseMeta = {
	clip: HasClip;
	opacity?: number;
	scale?: ScaleMeta;
};

export type GridMeta = BaseMeta & { gridRect:GridRect; };

export type PixelMeta = BaseMeta & { pixelRect:PixelRect; };

export type ImageMeta = GridMeta | PixelMeta;
