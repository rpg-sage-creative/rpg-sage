import type { HexColorString } from "@rsc-utils/core-utils";
import { debug, isDefined, randomSnowflake } from "@rsc-utils/core-utils";
import { dequote } from "@rsc-utils/core-utils";
import type { GameMapDataBase } from "../types/GameMapData.js";
import type { GameMapAura, GameMapImage } from "../types/GameMapImage.js";
import type { GridArgs } from "../types/GridArgs.js";
import type { GridCoordinate } from "../types/GridCoordinate.js";
import type { GridType } from "../types/GridType.js";
import type { HasClip } from "../types/HasClip.js";
import type { HasPixelDimensions } from "../types/HasDimensions.js";
import type { HasGridDimensions } from "../types/HasGridDimensions.js";
import type { HasScale } from "../types/HasScale.js";
import type { HasSize } from "../types/HasSize.js";
import type { NumberPair, NumberQuartet } from "../types/NumberArray.js";
import type { Point } from "../types/Point.js";

type MapSectionImageLayer = "background" | "terrain" | "aura" | "token";

type MapSectionLabel = "map" | "grid" | MapSectionImageLayer;

type MapData = {
	name: string;
	spawn?: GridCoordinate;
	user?: string;
};

/** reusable convenience for splice/trim/filter */
function splice(lines: string[], start: number, deleteCount: number): string[] {
	return lines
		.splice(start, deleteCount)
		.map(s => s.trim())
		.filter(s => s);
}

/** returns the first MapSectionParser for the given label */
function sectionByLabel(lines: string[], label: MapSectionLabel): MapSectionParser | undefined {
	const regex = /^\s*\[(map|grid|background|terrain|aura|token)\]\s*$/i;
	const sectionIndex = lines.findIndex(line => regex.exec(line)?.[1] === label);
	const nextSectionIndex = lines.findIndex((line, index) => index > sectionIndex && regex.test(line));
	if (sectionIndex < 0) {
		return undefined;
	}
	if (nextSectionIndex < 0) {
		return new MapSectionParser(label, splice(lines, sectionIndex, lines.length - sectionIndex));
	}
	return new MapSectionParser(label, splice(lines, sectionIndex, nextSectionIndex - sectionIndex));
}

/** returns all MapSectionParser objects for the given label */
function sectionsByLabel(lines: string[], label: MapSectionLabel): MapSectionParser[] {
	const matchers: MapSectionParser[] = [];
	let loop = true;
	do {
		const matcher = sectionByLabel(lines, label);
		if (matcher) {
			matchers.push(matcher);
		}else {
			loop = false;
		}
	}while(loop);
	return matchers;
}

export class MapSectionParser {
	public constructor(public label: MapSectionLabel, public lines: string[]) { }

	//#region boolean

	public boolean(key: string): boolean | undefined {
		const value = this.string(key);
		if (/^(true|t|false|f|yes|y|no|n|1|0)$/i.test(value ?? "")) {
			return /^(true|t|yes|y|1)$/i.test(value!);
		}
		return undefined;
	}

	//#endregion

	//#region color

	public color(key: string): HexColorString | undefined {
		const value = this.string(key);
		const match = /^(?:#|0x)(?<hex>[a-f0-9]{3}){1,2}$/i.exec(value ?? "");
		if (match) {
			return `#${match.groups?.hex.toLowerCase()}`;
		}
		return undefined;
	}

	//#endregion

	//#region clip

	public clip(): HasClip | undefined {
		const values = this.numbers<NumberQuartet>("clip");
		if (values) {
			return {
				clipX: values[0],
				clipY: values[1],
				clipWidth: values[2],
				clipHeight: values[3],
			};
		}
		return undefined;
	}

	//#endregion

	//#region cols and rows

	/**
	 * Matches the lines for the grid (cols/rows) and returns them (or 0).
	 */
	public colsAndRows(): HasGridDimensions | undefined {
		const grid = this.numbers<NumberPair>("grid");
		if (grid) {
			return { cols:grid[0], rows:grid[1] };
		}

		const cols = this.number("cols");
		const rows = this.number("rows");
		if (cols !== undefined && rows !== undefined) {
			return { cols, rows };
		}

		return undefined;
	}

	//#endregion

	//#region grid offset

	/**
	 * Matches the lines for the grid (cols/rows) and returns them.
	 */
	public gridOffset(): GridCoordinate | undefined {
		const pos = this.numbers<NumberPair>("pos(ition)?", false);
		if (pos) {
			return { col:pos[0], row:pos[1] };
		}

		const col = this.number("col");
		const row = this.number("row");
		if (col !== undefined && row !== undefined) {
			return { col, row };
		}

		return undefined;
	}

	//#endregion

	//#region grid type

	public gridType(key: string): GridType | undefined {
		return (this.string(key)?.match(/^(square|flat|pointy)$/i) ?? [])[0]?.toLowerCase() as "square";
	}

	//#endregion

	//#region number

	/**
	 * Matches a line to the RegExp and returns only the value (everything after the = sign) as a number.
	 */
	public number(regex: RegExp): number | undefined;

	/**
	 * Matches a line to the key and returns only the value (everything after the = sign) as a number (ignoring "px" if found).
	 */
	public number(key: string): number | undefined;

	/**
	 * Matches a line to the key and returns only the value (everything after the = sign) as a number.
	 * If px is true, the line is only matched if the value has "px".
	 * If px is false, the line is only matched if the value does NOT have "px".
	 */
	public number(key: string, px: boolean): number | undefined;

	public number(keyOrRegex: string | RegExp, pxOrUndefined?: boolean): number | undefined {
		let regex = keyOrRegex as RegExp;
		if (typeof(pxOrUndefined) === "boolean" && typeof(keyOrRegex) === "string") {
			const px = pxOrUndefined ? "\\s*px" : "";
			regex = new RegExp(`^(${keyOrRegex})\\s*=\\s*\\d+${px}\\s*$`, "i");
		}

		const value = this.string(regex, true);
		if (value) {
			return +value.replace(/px/i, "").trim();
		}

		return undefined;
	}

	//#endregion

	//#region numbers

	/**
	 * Matches a line to the RegExp and returns only the value (everything after the = sign) as a number array.
	 */
	public numbers<T extends number[]>(regex: RegExp): T | undefined;

	/**
	 * Matches a line to the key and returns only the value (everything after the = sign) as a number array (ignoring "px" if found).
	 */
	public numbers<T extends number[]>(key: string): T | undefined;

	/**
	 * Matches a line to the key and returns only the value (everything after the = sign) as a number array.
	 * If px is true, the line is only matched if the value has "px".
	 * If px is false, the line is only matched if the value does NOT have "px".
	 */
	public numbers<T extends number[]>(key: string, px: boolean): T | undefined;

	public numbers(keyOrRegex: string | RegExp, pxOrUndefined?: boolean): number[] | undefined {
		let regex = keyOrRegex as RegExp;
		if (typeof(pxOrUndefined) === "boolean" && typeof(keyOrRegex) === "string") {
			const px = pxOrUndefined ? "\\s*px" : "";
			regex = new RegExp(`^(${keyOrRegex})\\s*=\\s*\\d+${px}(\\s*[x,]\\s*\\d+${px})+\\s*$`, "i");
		}

		const value = this.string(regex, true);
		if (value) {
			const numbers = value.replace(/px/gi, "").split(/[x,]/).map(s => +s.trim());
			const twoOrFour = numbers.length === 2 || numbers.length === 4;
			if (twoOrFour && !numbers.find(num => isNaN(num))) {
				return numbers;
			}
		}

		return undefined;
	}

	//#endregion

	//#region percent

	public percent(key: string): number | undefined {
		const value = this.string(key);
		if (value) {
			if (/^\d+\s*%\s*$/.test(value)) {
				return (+value.replace(/%/, "").trim()) / 100;
			}else if (!isNaN(+value)) {
				return +value;
			}
		}
		return undefined;
	}

	//#endregion

	//#region pixel offset

	/**
	 * Matches the lines for the pixel (x/y) and returns them.
	 */
	public pixelOffset(): Point | undefined {
		const pos = this.numbers<NumberPair>(/^pos(ition)?=\s*\d+\s*px\s*[x,]\s*\d+\s*px\s*$/i);
		if (pos) {
			return { x:pos[0], y:pos[1] };
		}

		const x = this.number(/^(x|left)=/i);
		const y = this.number(/^(y|top)=/i);
		if (x !== undefined && y !== undefined) {
			return { x, y };
		}

		return undefined;
	}

	//#endregion

	//#region scale

	private getScale(key: "scale" | "scaleX" | "scaleY"): number | undefined {
		const scaleString = this.string(key);
		const scalePercent = (scaleString?.match(/(\d+)\s*%/) ?? [])[1];
		const scaleDecimal = (scaleString?.match(/(\d+\.\d+|\.\d+|\d+)/) ?? [])[1];
		if (scalePercent) {
			return (+scalePercent) / 100;
		}
		return scaleDecimal ? +scaleDecimal : undefined;
	}

	public scale(): HasScale | undefined {
		const scale = this.getScale("scale");
		const scaleX = this.getScale("scaleX");
		const scaleY = this.getScale("scaleY");
		return scale || scaleX || scaleY
			? { scale, scaleX, scaleY }
			: undefined;
	}

	//#endregion

	//#region size

	public get pixelDimensions(): HasPixelDimensions | undefined {
		const _widthAndHeight = this.numbers("size", true);
		const width = _widthAndHeight ? _widthAndHeight[0] : this.number("width");
		const height = _widthAndHeight ? _widthAndHeight[1] : this.number("height");
		return width && height ? { width, height } : undefined;
	}

	public get gridDimensions(): HasGridDimensions | undefined {
		const _colsAndRows = this.numbers("grid") ?? this.numbers("size", false);
		const cols = _colsAndRows ? _colsAndRows[0] : this.number("cols");
		const rows = _colsAndRows ? _colsAndRows[1] : this.number("rows");
		return cols && rows ? { cols, rows } : undefined;
	}

	/**
	 * Matches the lines for size (width/height and/or cols/rows)
	 */
	public size(): HasSize | undefined {
		const pixelDimensions = this.pixelDimensions;
		const gridDimensions = this.gridDimensions;

		if (pixelDimensions || gridDimensions) {
			return { ...pixelDimensions, ...gridDimensions };
		}

		return undefined;
	}

	//#endregion

	//#region string

	/**
	 * Matches a line to the key and returns only the value (everything after the = sign)
	 */
	public string<T extends string = string>(key: string): T | undefined;

	/**
	 * Matches a line to the regex and returns the entire line
	 */
	public string(regex: RegExp): string | undefined;

	/**
	 * Matches a line to the regex and returns only the value (everything after the = sign)
	 */
	public string(regex: RegExp, slice: true): string | undefined;

	public string(keyOrRegex: string | RegExp, sliceOrUndefined?: boolean): string | undefined {
		const isKey = typeof(keyOrRegex) === "string";
		const regex = isKey ? new RegExp(`^(${keyOrRegex})=`, "i") : keyOrRegex;
		const slice = isKey ? true : sliceOrUndefined;
		let line = this.lines.find(_line => regex.test(_line));
		if (line) {
			if (slice && line.includes("=")) {
				line = line.slice(line.indexOf("=") + 1);
			}
			line = dequote(line.trim()).trim();
			return line;
		}
		return undefined;
	}

	//#endregion

	//#region url

	public url(): string | undefined {
		return this.string("url") ?? this.string(/^https?:\/\//i);
	}
	//#endregion

	//#region toAura, toImage

	public toAura(): GameMapAura | undefined {
		const aura = this.toImage() as GameMapAura;
		if (aura) {
			aura.anchorId = this.string("anchor");
			aura.opacity = this.percent("opacity");
		}
		return aura;
	}

	public toGrid(): GridArgs | undefined {
		const { cols, rows } = this.colsAndRows() ?? { };
		if (!cols || !rows) {
			return undefined;
		}

		const gridColor = this.color("gridColor") ?? this.color("color");
		const gridType = this.gridType("gridType") ?? this.gridType("type") ?? "square";
		const colKey = this.boolean("colKey") ?? this.boolean("key");
		const rowKey = this.boolean("rowKey") ?? this.boolean("key");
		const colKeyScale = this.number("colKeyScale") ?? this.number("keyScale");
		const rowKeyScale = this.number("rowKeyScale") ?? this.number("keyScale");
		return { gridType, gridColor, cols, rows, colKey, rowKey, colKeyScale, rowKeyScale, width:0, height:0 };
	}

	public toMap(): MapData | undefined {
		const spawn = this.numbers<NumberPair>("spawn");
		const map = {
			name: this.string("name")!,
			spawn: spawn ? { col:spawn[0], row:spawn[1] } : undefined,
			user: this.string("user"),
		};

		if (!map.name) {
			debug(`MapSectionParser.toMap(): !name`);
			return undefined;
		}

		return map;
	}

	public toMapAndBackgroundAndGrid(): [MapData | undefined, GameMapImage | undefined, GridArgs | undefined] {
		const map = this.toMap();
		const image = this.toImage();
		const grid = this.toGrid();
		if (image && grid) {
			image.cols ??= grid.cols;
			image.rows ??= grid.rows;
		}
		return [map, image, grid];
	}

	public toImage(): GameMapImage | undefined {
		const imageData: GameMapImage = {
			gridOffset: this.gridOffset(),
			id: randomSnowflake(),
			name: this.string("name")!,
			pixelOffset: this.pixelOffset(),
			url: this.url()!,
			userId: this.string("user"),
			...this.clip(),
			...this.scale(),
			...this.size(),
		};

		if (!imageData.url || !imageData.name) {
			debug(`MapSectionParser.toImage(): !url (${!imageData.url}) || !name (${!imageData.name})`);
			return undefined;
		}

		return imageData;
	}

	//#endregion

	//#region static parse

	public static parse(raw: string): GameMapDataBase | undefined {
		const lines = raw.split(/\r?\n\r?/);
		const mapSection = sectionByLabel(lines, "map");
		if (mapSection) {
			const [map, bgImage, mapGrid] = mapSection.toMapAndBackgroundAndGrid();
			if (map) {
				const grid = mapGrid ?? sectionByLabel(lines, "grid")?.toGrid() ?? undefined;
				const background = sectionsByLabel(lines, "background").map(matcher => matcher.toImage()).filter(isDefined);
				if (bgImage) {
					background.unshift(bgImage);
				}
				const terrain = sectionsByLabel(lines, "terrain").map(matcher => matcher.toImage()).filter(isDefined);
				const aura = sectionsByLabel(lines, "aura").map(matcher => matcher.toAura()).filter(isDefined);
				const token = sectionsByLabel(lines, "token").map(matcher => matcher.toImage()).filter(isDefined);
				return {
					name: map.name,
					spawn: map.spawn,
					userId: map.user,
					grid,
					layers: {
						background: { type:"background", id:randomSnowflake(), images:background },
						terrain: { type:"terrain", id:randomSnowflake(), images:terrain },
						aura: { type:"aura", id:randomSnowflake(), images:aura },
						token: { type:"token", id:randomSnowflake(), images:token },
					}
				};
			}
		}
		return undefined;
	}

	//#endregion
}

export const parseMap = MapSectionParser.parse;