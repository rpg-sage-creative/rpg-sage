import type { SKRSContext2D } from "@napi-rs/canvas";
import type { HexColorString } from "@rsc-utils/core-utils";
import type { GridTile } from "./GridTile.js";

export type DrawArgs = {
	context?: SKRSContext2D;
	dX?: number;
	dY?: number;
	lineWidth?: number;
	strokeAlpha?: number;
	strokeStyle?: HexColorString;
};

/** @internal */
export function drawTile(tile: GridTile, args: DrawArgs): void {
	if (!args) throw new TypeError(`Invalid DrawArgs!`); // NOSONAR
	if (!args.context) throw new TypeError(`Invalid DrawArgs: missing "context"!`); // NOSONAR

	const {
		context,
		dX = 0,
		dY = 0,
		lineWidth = 1,
		strokeAlpha = 1,
		strokeStyle = "#000"
	} = args;

	context.save();

	context.beginPath();
	tile.points.forEach(({ x, y }) => context.lineTo(x + dX, y + dY));
	context.closePath();

	context.lineWidth = lineWidth;
	context.strokeStyle = strokeStyle;
	context.globalAlpha = strokeAlpha;
	context.stroke();

	context.restore();
}