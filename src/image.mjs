import { createCanvas, loadImage } from "@napi-rs/canvas";
import { writeFileSync } from "fs";
import { argv } from "process";

// https://www.redblobgames.com/grids/hexagons/

// https://github.com/flauwekeul/honeycomb/blob/master/src/grid/grid.ts

// const REMOTE = "https://cdn.discordapp.com/attachments/1150530513723990117/1161449588562071592/Plains_26x26.png?ex=65385738&is=6525e238&hm=047176805d751041faa25072e73cdf300ad27db0edb0c6a70ee74d1c5b5cf806&"
const LOCAL = "/Users/randaltmeyer/Downloads/Plains_26x26.png";
const ROWS = 26;
const COLS = 26;


function colToKey(col) {
	const left = Math.floor(col / 26);
	const leftCode = left > 0 ? 64 + left : 0;
	const right = col % 26;
	const rightCode = 65 + right;
	return (leftCode ? String.fromCharCode(leftCode) : "") + String.fromCharCode(rightCode);
}
function keyToCol(colKey = "") {
	const [left, right] = colKey.split("");
	const leftCode = left.charCodeAt(0);
	if (right) {
		const rightCode = right?.charCodeAt(0);
		return 26 * (leftCode - 65) + (rightCode - 64);
	}
	return leftCode - 64;
}

//#region Grid & Tile

class Grid {
	constructor({ bgImage, width, height, cols, rows, gridType, keys, colKeys, rowKeys, keyScale, colKeyScale, rowKeyScale } = { }) {
		width = bgImage?.naturalWidth ?? bgImage?.width ?? width;
		height = bgImage?.naturalHeight ?? bgImage?.height ?? height;
		colKeys = colKeys ?? keys ?? false;
		rowKeys = rowKeys ?? keys ?? false;
		colKeyScale = colKeyScale ?? keyScale ?? 1;
		rowKeyScale = rowKeyScale ?? keyScale ?? 1;
		const tileWidth = width / cols;
		const tileHeight = height / rows;
		const dX = rowKeys ? rowKeyScale * tileWidth : 0;
		const dY = colKeys ? colKeyScale * tileHeight : 0;
		const context = createCanvas(width + dX, height + dY).getContext("2d");
		this.core = { context, bgImage, width, height, cols, rows, tileWidth, tileHeight, gridType, colKeys, rowKeys, colKeyScale, rowKeyScale };
	}

	drawTile({ col, row, context, strokeStyle, dX, dY } = { }) {
		if (!context) {
			context = this.core.context;
			if (!context) return;

			const { tileWidth, tileHeight, colKeys, rowKeys, colKeyScale, rowKeyScale } = this.core;

			dX = rowKeys ? tileWidth * rowKeyScale : 0;
			dY = colKeys ? tileHeight * colKeyScale : 0;
		}

		this.get({ col, row }).draw({ context, strokeStyle, dX, dY });
	}

	fillTile({ col, row, context, fillStyle, dX, dY } = { }) {
		if (!context) {
			context = this.core.context;
			if (!context) return;

			const { tileWidth, tileHeight, colKeys, rowKeys, colKeyScale, rowKeyScale } = this.core;

			dX = rowKeys ? tileWidth * rowKeyScale : 0;
			dY = colKeys ? tileHeight * colKeyScale : 0;
		}

		this.get({ col, row }).fill({ context, fillStyle, dX, dY });
	}

	renderBackground({ context, bgImage } = { }) {
		context = context ?? this.core.context;
		if (!context) return;

		bgImage = bgImage ?? this.core.bgImage;
		if (!bgImage) return;

		const { tileWidth, tileHeight, colKeys, rowKeys, colKeyScale, rowKeyScale } = this.core;

		const dX = rowKeys ? tileWidth * rowKeyScale : 0;
		const dY = colKeys ? tileHeight * colKeyScale : 0;

		context.drawImage(bgImage, dX, dY);
	}

	renderGrid({ context, strokeStyle } = { }) {
		context = context ?? this.core.context;
		if (!context) return;

		const { tileWidth, tileHeight, colKeys, rowKeys, colKeyScale, rowKeyScale } = this.core;

		const dX = rowKeys ? tileWidth * rowKeyScale : 0;
		const dY = colKeys ? tileHeight * colKeyScale : 0;

		for (let col = 0; this.visible({col}); col++) {
			for (let row = 0; this.visible({row}); row++) {
				this.drawTile({ context, col, row, dX, dY, strokeStyle });
			}
		}
	}

	renderKeys({ context, bgImage, globalAlpha, fillStyle, strokeStyle } = { }) {
		context = context ?? this.core.context;
		if (!context) return;

		bgImage = bgImage ?? this.core.bgImage;
		if (!bgImage) return;

		const { colKeys, rowKeys } = this.core;
		if (!colKeys && !rowKeys) return;

		const { width, height, tileWidth, tileHeight, colKeyScale, rowKeyScale } = this.core;

		const adjustedHeight = tileHeight * colKeyScale;
		const adjustedWidth = tileWidth * rowKeyScale;

		//#region drawImage

		if (colKeys || rowKeys) {

			// use pixel 0,0 to fill in the top left corner
			context.drawImage(bgImage, 0, 0, 1, 1, 0, 0, adjustedWidth, adjustedHeight);

			if (colKeys) {
				const adjustedX = rowKeys ? tileWidth * rowKeyScale : 0;
				context.drawImage(bgImage, 0, 0, width, 1, adjustedX, 0, width, adjustedHeight);
			}

			if (rowKeys) {
				const adjustedY = colKeys ? tileHeight * colKeyScale : 0;
				context.drawImage(bgImage, 0, 0, 1, height, 0, adjustedY, adjustedWidth, height);
			}

		}

		//#endregion

		//#region fillRect

		if (colKeys || rowKeys) {
			context.save();
			context.globalAlpha = globalAlpha ?? 0.7;
			context.fillStyle = fillStyle ?? "#000";

			context.fillRect(0, 0, adjustedWidth, adjustedHeight);

			if (colKeys) {
				context.fillRect(adjustedWidth, 0, width, adjustedHeight);
			}

			if (rowKeys) {
				context.fillRect(0, adjustedHeight, adjustedWidth, height);
			}

			context.restore();
		}

		//#endregion

		//#region text

		context.save();
		context.fillStyle = strokeStyle ?? "#fff";
		context.strokeStyle = strokeStyle ?? "#fff";
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.font = `${Math.min(tileWidth, tileHeight) * 0.33}px serif`;

		if (colKeys) {
			const dX = rowKeys ? tileWidth * rowKeyScale : 0;
			for (let col = 0; this.has({col}); col++) {
				const centerX = this.get({col,row:0}).center.x;
				// move up from center
				const mY = 0.5 * colKeyScale;

				context.fillText(colToKey(col), centerX + dX, tileHeight * mY, adjustedWidth);
			}
		}

		if (rowKeys) {
			const dY = colKeys ? tileHeight * colKeyScale : 0;
			for (let row = 0; this.visible({row}); row++) {
				const centerY = this.get({col:0,row}).center.y;
				// move left from center
				const mX = 0.5 * rowKeyScale;

				context.fillText(String(row+1), tileWidth * mX, centerY + dY, adjustedWidth);
			}
		}

		context.restore();

		//#endregion

	}

	render({ context, bgImage, mimeType } = { }) {
		context = context ?? this.core.context;
		if (!context) return;

		bgImage = bgImage ?? this.core.bgImage;
		if (!bgImage) return;

		this.renderBackground({ context, bgImage });
		this.renderKeys({ context, bgImage });
		this.renderGrid({ context });

		return context.canvas.toBuffer(mimeType ?? "image/png");
	}

	toBuffer({ mimeType } = { }) {
		return this.core.context?.canvas.toBuffer(mimeType ?? "image/png");
	}

	get({ col, row } = { }) {
		const [width, height] = [this.core.tileWidth, this.core.tileHeight];
		return new Tile({ col, row, width, height, gridType });
	}

	has({ col, row } = { }) {
		const { tileWidth, tileHeight, key } = this.core;
		const dX = key ? tileWidth : 0;
		const dY = key ? tileHeight : 0;
		const tile = this.get({ col:col??0, row:row??0 });
		const center = tile.center;
		return center.x < this.core.width + dX && center.y < this.core.height + dY;
	}

	visible({ col, row } = { }) {
		const { tileWidth, tileHeight, key } = this.core;
		const dX = key ? tileWidth : 0;
		const dY = key ? tileHeight : 0;
		const tile = this.get({ col:col??0, row:row??0 });
		const least = tile.least;
		return least.x < this.core.width + dX && least.y < this.core.height + dY;
	}
}

function squareMove({ col, row, dir } = { }) {
	dir = dir.toUpperCase();
	if (["NW", "N", "NE"].includes(dir)) row--;
	if (["SW", "S", "SE"].includes(dir)) row++;
	if (["NW", "W", "SW"].includes(dir)) col--;
	if (["NE", "E", "SE"].includes(dir)) col++;
	return { col, row };
}
function flatMove({ col, row, dir } = { }) {
	dir = dir.toUpperCase();
	const evenCol = col % 2 === 0;
	switch(dir) {
		case "NW": col--; row -= evenCol ? 1 : 0; break;
		case "N":         row--; break;
		case "NE": col++; row -= evenCol ? 1 : 0; break;
		case "SW": col--; row += evenCol ? 0 : 1; break;
		case "S":         row++; break;
		case "SE": col++; row += evenCol ? 0 : 1; break;
	}
	return { col, row };
}
function pointyMove({ col, row, dir } = { }) {
	dir = dir.toUpperCase();
	const evenRow = row % 2 === 0;
	switch(dir) {
		case "NW": col -= evenRow ? 1 : 0; row--; break;
		case "W":  col--; break;
		case "SW": col -= evenRow ? 1 : 0; row++; break;
		case "NE": col += evenRow ? 0 : 1; row--; break;
		case "E":  col++; break;
		case "SE": col += evenRow ? 0 : 1; row++; break;
	}
	return { col, row };
}

class Tile {
	constructor({ col, row, width, height, gridType } = { }) {
		this.core = { col, row, width, height, gridType };
	}

	/** { x, y } that represents center of the tile */
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

	/** { x, y } that represents the point closest to origin (0,0) */
	get least() {
		const points = this.points;
		return points.reduce((least, point) => {
			if (!least) return point;
			if (point.x < least.x || point.y < least.y) return point;
			return least;
		}, undefined);
	}

	/** { x, y }[] that represents all points of the tile */
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

	draw({ context, strokeStyle, dX, dY } = { }) {
		if (!context) return;

		context.save();
		context.strokeStyle = strokeStyle ?? "#000";
		context.beginPath();

		dX = dX ?? 0;
		dY = dY ?? 0;

		this.points.forEach(({ x, y }) => context.lineTo(x + dX, y + dY));

		context.closePath();
		context.stroke();
		context.restore();
	}

	fill({ context, fillStyle, dX, dY } = { }) {
		if (!context) return;

		context.save();
		context.fillStyle = fillStyle ?? "#000";
		context.beginPath();

		dX = dX ?? 0;
		dY = dY ?? 0;

		this.points.forEach(({ x, y }) => context.lineTo(x + dX, y + dY));

		context.closePath();
		context.fill();
		context.restore();
	}

	move({ dir } = { }) {
		const args = { ...this.core, dir };
		switch(this.core.gridType) {
			case "flat": return new Tile({ ...this.core, ...flatMove(args) });
			case "pointy": return new Tile({ ...this.core, ...pointyMove(args) });
			default: return new Tile({ ...this.core, ...squareMove(args) });
		}
	}
}

//#endregion

async function main({ url, cols, rows, gridType, keys, colKeys, rowKeys, colKeyScale, rowKeyScale, tile }) {
	const bgImage = await loadImage(url);

	const grid = new Grid({ bgImage, cols, rows, gridType, keys, colKeys, rowKeys, colKeyScale, rowKeyScale });
	grid.renderBackground();
	grid.renderKeys();
	grid.renderGrid();

	const [_tile, tileCol, tileRow] = tile?.match(/(\d+)[,x](\d+)/i) ?? tile?.match(/([a-z]+)(\d+)/i) ?? [];
	if (_tile) {
		const _col = +tileCol || keyToCol(tileCol.toUpperCase());
		const col = _col - 1;
		const _row = +tileRow;
		const row = _row - 1;
		// const fillStyle = "#ff0000";
		const strokeStyle = "#ff0000";
		const one = grid.get({ col, row });
		const two = one.move({ dir:"NW" });
		const three = two.move({ dir:"N" });
		const four = three.move({ dir:"NE" });
		grid.fillTile({ ...one.core, fillStyle:"#ff0000", strokeStyle });
		grid.fillTile({ ...two.core, fillStyle:"#00ff00", strokeStyle });
		grid.fillTile({ ...three.core, fillStyle:"#0000ff", strokeStyle });
		grid.fillTile({ ...four.core, fillStyle:"#ff00ff", strokeStyle });
	}

	const buffer = grid.toBuffer();

	writeFileSync("./out.png", buffer);

}

const args = argv.slice(2);
const gridType = args.find(arg => ["flat","pointy"].includes(arg));
const keys = args.includes("keys");
const rowKeys = args.includes("rowKeys") || keys;
const colKeys = args.includes("colKeys") || keys;
const keyScales = args.filter(arg => arg.match(/^\d+(\.\d+)?$/));
const colKeyScale = keyScales[0] ? +keyScales[0] : 0.5;
const rowKeyScale = keyScales[1] ? +keyScales[1] : colKeyScale;
const tile = args.find(arg => arg.match(/[a-z]+\d+|\d+[,x]\d+/i));
main({ url:LOCAL, cols:COLS, rows:ROWS, gridType, keys, colKeys, rowKeys, colKeyScale, rowKeyScale, tile });