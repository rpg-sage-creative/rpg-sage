import { SKRSContext2D } from "@napi-rs/canvas";

type BaseGridLineValues = {
	strokeStyle?: string;

	cols: number;
	pxPerCol: number;

	rows: number;
	pxPerRow: number;
};

type ColGridLineValues = BaseGridLineValues & {
	col: number;
};

type RowGridLineValues = BaseGridLineValues & {
	row: number;
};

type GridLineValues = BaseGridLineValues & {
	col?: number;
	row?: number;
};

export function drawGridLine(context: SKRSContext2D, colGridLineValues: ColGridLineValues): void;
export function drawGridLine(context: SKRSContext2D, rowGridLineValues: RowGridLineValues): void;
export function drawGridLine(context: SKRSContext2D, { strokeStyle, col, cols, pxPerCol, row, rows, pxPerRow }: GridLineValues): void {
	if (strokeStyle) {
		context.save();
		context.strokeStyle = strokeStyle;
	}

	context.beginPath();

	if (col !== undefined) {
		context.moveTo(col * pxPerCol, 0);
		context.lineTo(col * pxPerCol, rows * pxPerRow + pxPerRow);
	}

	if (row !== undefined) {
		context.moveTo(0, row * pxPerRow);
		context.lineTo(cols * pxPerCol + pxPerCol, row * pxPerRow);
	}

	context.closePath();

	context.stroke();

	if (strokeStyle) {
		context.restore();
	}
}
