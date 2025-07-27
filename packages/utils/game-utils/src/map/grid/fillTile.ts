import type { HexColorString } from "@rsc-utils/core-utils";
import type { GridTile } from "./GridTile.js";
import type { DrawArgs } from "./drawTile.js";

export type FillArgs = DrawArgs & {
	fillAlpha?: number;
	fillStyle?: HexColorString;
};

/** @internal */
export function fillTile(tile: GridTile, args: FillArgs): void {
	if (!args) throw new TypeError(`Invalid FillArgs!`); // NOSONAR
	if (!args.context) throw new TypeError(`Invalid FillArgs: missing "context"!`); // NOSONAR

	const {
		context,
		dX = 0,
		dY = 0,
		fillAlpha = 1,
		fillStyle = "#000",
		lineWidth = 1,
		strokeAlpha = 1,
		strokeStyle = "#000"
	} = args;

	context.save();

	context.beginPath();
	tile.points.forEach(({ x, y }) => context.lineTo(x + dX, y + dY));
	context.closePath();

	context.fillStyle = fillStyle;
	context.globalAlpha = fillAlpha;
	context.fill();

	context.lineWidth = lineWidth;
	context.strokeStyle = strokeStyle;
	context.globalAlpha = strokeAlpha;
	context.stroke();

	context.restore();
}