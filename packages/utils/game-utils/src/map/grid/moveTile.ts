import type { HasCompassDirection } from "../types/CompassDirection.js";
import type { GridCoordinate } from "../types/GridCoordinate.js";
import type { HasGridType } from "../types/GridType.js";
import { GridTile } from "./GridTile.js";

type MoveArgs = GridCoordinate & HasGridType & HasCompassDirection;

/** Moves on a square grid. */
function squareMove({ col, row, dir }: MoveArgs): GridCoordinate {
	if (["NW", "N", "NE"].includes(dir)) row--; // NOSONAR
	if (["SW", "S", "SE"].includes(dir)) row++; // NOSONAR
	if (["NW", "W", "SW"].includes(dir)) col--; // NOSONAR
	if (["NE", "E", "SE"].includes(dir)) col++; // NOSONAR
	return { col, row };
}

/** Moves on a flat hex grid. */
function flatMove({ col, row, dir }: MoveArgs): GridCoordinate {
	const evenCol = col % 2 === 0;
	switch(dir) {
		case "NW": col--; row -= evenCol ? 1 : 0; break; // NOSONAR
		case "N":         row--; break;                  // NOSONAR
		case "NE": col++; row -= evenCol ? 1 : 0; break; // NOSONAR
		case "SW": col--; row += evenCol ? 0 : 1; break; // NOSONAR
		case "S":         row++; break;                  // NOSONAR
		case "SE": col++; row += evenCol ? 0 : 1; break; // NOSONAR
	}
	return { col, row };
}

/** Moves on a pointy grid. */
function pointyMove({ col, row, dir }: MoveArgs): GridCoordinate {
	const evenRow = row % 2 === 0;
	switch(dir) {
		case "NW": col -= evenRow ? 1 : 0; row--; break; // NOSONAR
		case "W":  col--; break;                         // NOSONAR
		case "SW": col -= evenRow ? 1 : 0; row++; break; // NOSONAR
		case "NE": col += evenRow ? 0 : 1; row--; break; // NOSONAR
		case "E":  col++; break;                         // NOSONAR
		case "SE": col += evenRow ? 0 : 1; row++; break; // NOSONAR
	}
	return { col, row };
}

/** Moves according to the included gridType. */
function move(args: MoveArgs): GridCoordinate {
	switch(args.gridType) {
		case "flat": return flatMove(args);
		case "pointy": return pointyMove(args);
		default: return squareMove(args);
	}
}

type SimpleGridTile = GridCoordinate & HasGridType;

/** @todo these args currently only allow directional movement. in the future, could these args also allow moving to a point? */
export function moveTile(tile: GridTile, ...dirs: HasCompassDirection[]): GridTile;
export function moveTile(tile: SimpleGridTile, ...dirs: HasCompassDirection[]): SimpleGridTile;
export function moveTile(tile: GridTile | SimpleGridTile, ...dirs: HasCompassDirection[]): SimpleGridTile {
	let core = { col:tile.col, row:tile.row, gridType:tile.gridType };
	for (const { dir } of dirs) {
		const moveArgs = { col:core.col, row:core.row, gridType:core.gridType, dir };
		core = { ...core, ...move(moveArgs) };
	}
	if ("toJSON" in tile) {
		return new GridTile({ ...tile.toJSON(), ...core });
	}
	return core;
}