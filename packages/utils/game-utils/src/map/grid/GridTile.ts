import { Coord } from "../Coord.js";
import type { HasCompassDirection } from "../types/CompassDirection.js";
import type { GridCoordinate } from "../types/GridCoordinate.js";
import type { GridType, HasGridType } from "../types/GridType.js";
import type { HasPixelDimensions } from "../types/HasDimensions.js";
import type { Point } from "../types/Point.js";
import { drawTile, type DrawArgs } from "./drawTile.js";
import { fillTile, type FillArgs } from "./fillTile.js";
import { moveTile } from "./moveTile.js";

export type GridTileCore = GridCoordinate & HasPixelDimensions & HasGridType;

/** Origin is Top,Left and 0,0 */
export class GridTile {
	protected core: GridTileCore;

	public constructor({ col, row, width, height, gridType }: GridTileCore) {
		this.core = { col, row, width, height, gridType };
	}

	/** { x, y } that represents center of the tile */
	public get center(): Point {
		const { col, row, width, height, gridType } = this.core;
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

	public get col(): number { return this.core.col; }

	public get coord(): Coord { return new Coord(this.core.col, this.core.row); }

	public get gridType(): GridType { return this.core.gridType; }

	public get height(): number { return this.core.height; }

	/** { x, y } that represents a point made up of the smallest x and smallest y from all points. */
	public get least(): Point {
		const points = this.points;
		return points.reduce((least, point) => {
			return {
				x: Math.min(point.x, least?.x ?? point.x),
				y: Math.min(point.y, least?.y ?? point.y)
			};
		}, { } as Point);
	}

	/** { x, y } that represents a point made up of the greatest x and greatest y from all points. */
	public get most(): Point {
		const points = this.points;
		return points.reduce((most, point) => {
			return {
				x: Math.max(point.x, most?.x ?? point.x),
				y: Math.max(point.y, most?.y ?? point.y)
			};
		}, { } as Point);
	}

	/** { x, y }[] that represents all points of the tile */
	public get points(): Point[] {
		const { x, y } = this.center;
		const { width, height, gridType } = this.core;
		switch(gridType) {
			case "flat": {
				return [
					{ x: x + width * 0.25, y: y - height * 0.5 },
					{ x: x + width * 0.5, y },
					{ x: x + width * 0.25, y: y + height * 0.5 },
					{ x: x - width * 0.25, y: y + height * 0.5 },
					{ x: x - width * 0.5, y },
					{ x: x - width * 0.25, y: y - height * 0.5 },
				];
			}
			case "pointy": {
				return [
					{ x: x + width * 0.5, y: y - height * 0.25 },
					{ x: x + width * 0.5, y: y + height * 0.25 },
					{ x, y: y + height * 0.5 },
					{ x: x - width * 0.5, y: y + height * 0.25 },
					{ x: x - width * 0.5, y: y - height * 0.25 },
					{ x, y: y - height * 0.5 },
				];
			}
			default: {
				return [
					{ x: x + width * 0.5, y: y - height * 0.5 },
					{ x: x + width * 0.5, y: y + height * 0.5 },
					{ x: x - width * 0.5, y: y + height * 0.5 },
					{ x: x - width * 0.5, y: y - height * 0.5 },
				];
			}
		}
	}

	public get row(): number { return this.core.row; }

	public get width(): number { return this.core.width; }

	public draw(args: DrawArgs) {
		drawTile(this, args);
	}

	public fill(args: FillArgs) {
		fillTile(this, args);
	}

	public move(...dirs: HasCompassDirection[]): GridTile {
		return moveTile(this, ...dirs);
	}

	public toJSON(): GridTileCore {
		return this.core;
	}
}
