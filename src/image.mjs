import { createCanvas, loadImage } from "@napi-rs/canvas";
import { writeFileSync } from "fs";
import { argv } from "process";

// https://www.redblobgames.com/grids/hexagons/

// https://github.com/flauwekeul/honeycomb/blob/master/src/grid/grid.ts

const REMOTE = "https://cdn.discordapp.com/attachments/1150530513723990117/1161449588562071592/Plains_26x26.png?ex=65385738&is=6525e238&hm=047176805d751041faa25072e73cdf300ad27db0edb0c6a70ee74d1c5b5cf806&"
const LOCAL = "/Users/randaltmeyer/Downloads/Plains_26x26.png";
const ROWS = 26;
const COLS = 26;
const arg = process.argv.find(arg => arg.match(/^\d+(\.\d+)?$/));
const KEY_DX_MULTIPLIER = arg ? +arg : 0.5;
const KEY_DY_MULTIPLIER = arg ? +arg : 0.5;
//#region square


function colToKey(col) {
	const left = Math.floor(col / 26);
	const leftCode = left > 0 ? 64 + left : 0;
	const right = col % 26;
	const rightCode = 65 + right;
	return (leftCode ? String.fromCharCode(leftCode) : "") + String.fromCharCode(rightCode);
}

//#endregion

//#region Grid & Tile

class Grid {
	constructor({ bgImage, width, height, cols, rows, gridType, key }) {
		width = bgImage?.naturalWidth ?? bgImage?.width ?? width;
		height = bgImage?.naturalHeight ?? bgImage?.height ?? height;
		const pxPerCol = width / cols;
		const pxPerRow = height / rows;
		this.core = { bgImage, width, height, cols, rows, pxPerCol, pxPerRow, gridType, key };
	}

	/**
	 * @param {({col:number,row:number,context:import("@napi-rs/canvas").SKRSContext2D,color?:string,dX?:number,dY?:number})}
	 * @returns {Tile}
	 */
	draw({ col, row, context, color, dX, dY }) {
		// if col/row, draw that one
		this.get({ col, row }).draw({ context, color, dX, dY });
		// if col only, draw that column
		// if row only, draw that row
		// if no col/row, draw the whole thing
	}

	/**
	 * @param {({context:import("@napi-rs/canvas").SKRSContext2D})}
	 */
	drawAll({ context }) {
		const { bgImage, pxPerCol, pxPerRow, key } = this.core;

		const dX = key ? pxPerCol * KEY_DX_MULTIPLIER : 0;
		const dY = key ? pxPerRow * KEY_DY_MULTIPLIER : 0;

		for (let col = 0; this.has({col}); col++) {
			for (let row = 0; this.has({row}); row++) {
				const tile = this.get({ col, row });
				if (key) {
					if (!row) {
						tile.fillGridKey({ context, bgImage, col });
						if (col) tile.drawGridKey({ context, col });
					}
					if (!col) {
						tile.fillGridKey({ context, bgImage, row });
						if (row) tile.drawGridKey({ context, row });
					}
				}
				this.draw({ col, row, context, dX, dY });
			}
		}
	}

	/**
	 * @param {({col:number,row:number})}
	 * @returns {Tile}
	 */
	get({ col, row }) {
		const [width, height] = [this.core.pxPerCol, this.core.pxPerRow];
		return new Tile({ col, row, width, height, gridType });
	}

	/**
	 * @param {({col:number,row:number})}
	 * @returns {boolean}
	 */
	has({ col, row }) {
		const { pxPerCol, pxPerRow, key } = this.core;
		const dX = key ? pxPerCol : 0;
		const dY = key ? pxPerRow : 0;
		const tile = this.get({ col:col??0, row:row??0 })
		return tile.center.x < this.core.width + dX && tile.center.y < this.core.height + dY;
	}
}
class Tile {
	constructor({ col, row, width, height, gridType }) {
		this.core = { col, row, width, height, gridType };
	}
	get center() {
		const { col, row, width, height } = this.core;
		const x = col * width + width / 2;
		const y = row * height + height / 2;
		switch(gridType) {
			case "flat": {
				const dX = -1 * col * width * 0.25;
				const dY = col % 2 === 0 ? 0 : height * 0.5;
				return { x:x + dX, y:y + dY };
			}
			case "pointy": {
				const dX = row % 2 === 0 ? 0 : width * 0.5;
				const dY = -1 * row * height * 0.25;
				return { x:x + dX, y:y + dY };
			}
			default:
				return { x, y };
		}
	}
	get points() {
		const { x, y } = this.center;
		const w = this.core.width;
		const h = this.core.height;
		switch(gridType) {
			case "flat": {
				return [
					{ x: x + w * 0.25, y: y - h * 0.5 },
					{ x: x + w * 0.5, y },
					{ x: x + w * 0.25, y: y + h * 0.5 },
					{ x: x - w * 0.25, y: y + h * 0.5 },
					{ x: x - w * 0.5, y },
					{ x: x - w * 0.25, y: y - h * 0.5 },
				];
			}
			case "pointy": {
				return [
					{ x: x + w * 0.5, y: y - h * 0.25 },
					{ x: x + w * 0.5, y: y + h * 0.25 },
					{ x, y: y + h * 0.5 },
					{ x: x - w * 0.5, y: y + h * 0.25 },
					{ x: x - w * 0.5, y: y - h * 0.25 },
					{ x, y: y - h * 0.5 },
				];
			}
			default: {
				return [
					{ x: x + w * 0.5, y: y - h * 0.5 },
					{ x: x + w * 0.5, y: y + h * 0.5 },
					{ x: x - w * 0.5, y: y + h * 0.5 },
					{ x: x - w * 0.5, y: y - h * 0.5 },
				];
			}
		}
	}
	draw({ context, color, dX, dY }) {
		context.save();
		context.strokeStyle = color ?? "#000";
		context.beginPath();

		dX = dX ?? 0;
		dY = dY ?? 0;

		this.points.forEach(({ x, y }) => context.lineTo(x + dX, y + dY));

		context.closePath();
		context.stroke();
		context.restore();
	}
	/**
	 * @param {({context:import("@napi-rs/canvas").SKRSContext2D})}
	 */
	fillGridKey({ context, bgImage, col, row, globalAlpha, fillStyle }) {
		const { width, height } = this.core;

		const adjustedWidth = width * KEY_DX_MULTIPLIER;
		const adjustedHeight = height * KEY_DY_MULTIPLIER;

		context.save();
		if (bgImage) {
			if (col !== undefined) {
				context.drawImage(bgImage, col * width, 0, width, adjustedHeight, col * width + adjustedWidth, 0, width, adjustedHeight);
			}
			if (row !== undefined) {
				context.drawImage(bgImage, 0, row * height, adjustedWidth, height, 0, row * height + adjustedHeight, adjustedWidth, height);
			}
		}
		context.globalAlpha = globalAlpha ?? 0.7;
		context.fillStyle = fillStyle ?? "#000";
		if (col !== undefined) {
			context.fillRect(col * width, 0, width, adjustedHeight);
		}
		if (row !== undefined) {
			context.fillRect(0, row * height, adjustedWidth, height);
		}
		context.restore();
	}
	drawGridKey({ context, col, row, fillStyle, strokeStyle, textAlign, textBaseLine, font }) {
		const { width, height, gridType } = this.core;

		context.save();
		context.fillStyle = fillStyle ?? "#fff";
		context.strokeStyle = strokeStyle ?? "#000";
		context.textAlign = textAlign ?? "center";
		context.textBaseline = textBaseLine ?? "middle";
		context.font = font ?? `${Math.min(width, height) * 0.33}px serif`;

		if (col !== undefined) {
			// shift by row key width, subtracted by width because we are a col ahead
			const shiftX = width * KEY_DX_MULTIPLIER - width;
			// wobble the flat hexes
			const wobbleX = gridType === "flat" ? width * 0.25 : 0;
			// move up from center
			const mY = 0.5 * KEY_DY_MULTIPLIER;

			context.fillText(colToKey(col - 1), this.center.x + shiftX + wobbleX, height * mY, width);
		}
		if (row !== undefined) {
			// shift by col key height, subtracted by height because we are a row ahead
			const shiftY = height * KEY_DY_MULTIPLIER - height;
			// wobble pointy hexes
			const wobbleY = gridType === "pointy" ? height * 0.25 : 0;
			// move left from center
			const mX = 0.5 * KEY_DX_MULTIPLIER;

			context.fillText(String(row), width * mX, this.center.y + shiftY + wobbleY, width);
		}
		context.restore();
	}
}

//#endregion

//#region hex

//#endregion

//#region h-hex

function drawHexGridKey(context, { x, y, col, row, pxPerCol, pxPerRow }) {
	context.save();
	context.fillStyle = "#fff";
	context.strokeStyle = "#000";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.font = `${pxPerRow / 2}px serif`;
	if (col !== undefined) {
		context.fillText(colToKey(col), (col + 1) * pxPerCol + pxPerCol / 2, pxPerRow / 2, pxPerCol);
	}
	if (row !== undefined) {
		context.fillText(String(row + 1), pxPerCol / 2, (row + 1) * pxPerRow + pxPerRow / 2, pxPerCol);
	}
	// context.fillText(colToKey(col) + String(row + 1), pxPerCol / 2, (row+1) * pxPerRow + pxPerRow / 2, pxPerCol);
	context.restore();
}


function labelHexGrid(context, { bgImage, width, height, cols, rows, pxPerCol, pxPerRow, key, gridType }) {

}

async function main({ url, cols, rows, gridType, key }) {
	const bgImage = await loadImage(url);
	const { height, width } = bgImage;

	const pxPerRow = height / rows;
	const pxPerCol = width / cols;

	const dX = key ? pxPerCol * KEY_DX_MULTIPLIER : 0;
	const dY = key ? pxPerRow * KEY_DY_MULTIPLIER : 0;

	const context = createCanvas(width + dX, height + dY).getContext("2d");
	context.drawImage(bgImage, dX, dY);

	const grid = new Grid({ bgImage, cols, rows, gridType, key });
	grid.drawAll({ context });

	writeFileSync("./out.png", context.canvas.toBuffer("image/png"));

}
const gridType = argv.find(arg => ["flat","pointy"].includes(arg));
const key = argv.includes("key");
main({ url:LOCAL, cols:COLS, rows:ROWS, gridType, key });