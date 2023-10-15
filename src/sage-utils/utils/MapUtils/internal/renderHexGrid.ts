import { SKRSContext2D } from "@napi-rs/canvas";
import { drawGridLine } from "./drawGridLine";

type HexGridValues = {
	strokeStyle?: string;

	cols: number;
	pxPerCol: number;

	rows: number;
	pxPerRow: number;
};

export function renderHexGrid(context: SKRSContext2D, { strokeStyle, cols, pxPerCol, rows, pxPerRow }: HexGridValues): void {
	if (strokeStyle) {
		context.save();
		context.strokeStyle = strokeStyle;
	}
	for (let col = 0; col <= cols; col++) {
		drawGridLine(context, { col, cols, pxPerCol, rows, pxPerRow });
	}
	for (let row = 0; row <= rows; row++) {
		drawGridLine(context, { cols, pxPerCol, row, rows, pxPerRow });
	}
	if (strokeStyle) {
		context.restore();
	}
}