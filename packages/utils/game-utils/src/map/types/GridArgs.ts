import type { SKRSContext2D } from "@napi-rs/canvas";
import type { HexColorString } from "@rsc-utils/core-utils";
import type { GridType } from "./GridType.js";

export type GridArgs = {
	context?: SKRSContext2D;

	/** width of grid in pixels */
	width: number;
	/** height of grid in pixels */
	height: number;

	/** number of columns */
	cols: number;
	/** number of rows */
	rows: number;

	/** square, flat (hex), pointy (hex) */
	gridType: GridType;
	/** hex value, defaults to #000 */
	gridColor?: HexColorString;
	gridWidth?: number;

	/** show both keys */
	keys?: boolean;
	/** show column key */
	colKey?: boolean;
	/** show row key */
	rowKey?: boolean;

	/** multiplier used to scale the size of both keys */
	keyScale?: number;
	/** multiplier used to scale the size of the column keys */
	colKeyScale?: number;
	/** multiplier used to scale the size of the row keys */
	rowKeyScale?: number;
};
