import type { GridCoordinate } from "./GridCoordinate.js";
import type { Point } from "./Point.js";

/** This object has grid and pixel offsets. */
export type HasOffset = {
	/** offset from origin: { col, row } */
	gridOffset?: GridCoordinate;

	/** pixel offset from origin: { x, y } */
	pixelOffset?: Point;
};