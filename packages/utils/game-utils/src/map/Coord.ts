import { debug, type Args } from "@rsc-utils/core-utils";
import type { GridCoordinate } from "./types/GridCoordinate.js";

type GridCoord = `${number},${number}`;
type ColKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
type KeyCoord = `${ColKey}${number}`;

/** Other coordinate values derived from col/row. */
type CoordinateExtras = {
	/** Column key, starting with A */
	colKey: ColKey;
	/** Comma separated col,row value: "1,1" */
	gridCoord: GridCoord;
	/** Column key and row number value: "A1" */
	keyCoord: KeyCoord;
};

/** A simple col/row pair where the col is a key value: { col:"A", row:1 } */
type KeyCoordinate = {
	/** Column key, starting with A */
	col: string;
	/** Row number, starting with 1 */
	row: number;
};

/** Represents the col/row values of a Tile's location on a Grid. */
type Coordinate = GridCoordinate & CoordinateExtras;

/** Coord only requires numeric col/row for basic usage. */
type CoordCore = GridCoordinate & Args<CoordinateExtras>;

function getConversionValues() {
	const codeA = "A".charCodeAt(0);
	const codeZ = "Z".charCodeAt(0);
	const letterCount = codeZ - codeA + 1;
	return { codeA, codeZ, letterCount };
}

/**
 * Convert the given column number to an alpha key.
 * 1 = A; 26 = Z; 27 = AA
 */
function colToKey(col: number): string {
	const { codeA, letterCount } = getConversionValues();

	// the math uses a zero-based counter
	let colIndex = col - 1;

	let output = "";
	while (colIndex >= 0) {
		// get next letter
		const letter = String.fromCharCode(colIndex % letterCount + codeA);

		// prepend letter
		output = letter + output;

		// decrement col
		colIndex = Math.floor(colIndex / letterCount) - 1;
	}

	return output;
}

/**
 * Convert the given alpha key to a column number.
 * A = 1; Z = 26; AA = 27
 */
function keyToCol(colKey: string): number {
	const { codeA, letterCount } = getConversionValues();

	// convert key to letters then codes then values
	const letters = colKey.split("");
	const codes = letters.map(letter => letter.charCodeAt(0));
	const values = codes.map(code => code - codeA);

	// do the math
	return values.reduce((out, value, index) => {
		const place = letters.length - index - 1;
		const vMult = value + 1;
		const pMult = Math.pow(letterCount, place);
		return out + vMult * pMult;
	}, 0);
}

/**
 * A representation of a location on a Grid.
 * Columns and Rows start at 1,1 (A1) in the top left corner of the Grid.
 */
export class Coord implements Coordinate {
	private core: CoordCore;

	public constructor(col: number, row: number);
	public constructor(colKey: string, row: number);
	public constructor(colArg: number | string, row: number) {
		if (typeof(colArg) === "string") {
			colArg = colArg.toUpperCase();
			this.core = { col:keyToCol(colArg), colKey:colArg as ColKey, row };
		}else {
			this.core = { col:colArg, row };
		}
	}

	public get col(): number { return this.core.col; }
	public get colKey(): ColKey { return this.core.colKey ?? (this.core.colKey = colToKey(this.core.col) as ColKey); }
	public get gridCoord(): GridCoord { return this.core.gridCoord ?? (this.core.gridCoord = `${this.core.col},${this.core.row}`); }
	public get keyCoord(): KeyCoord { return this.core.keyCoord ?? (this.core.keyCoord = `${this.colKey}${this.core.row}`); }
	public get row(): number { return this.core.row; }

	public toCoordinate(): Coordinate {
		const { col, colKey, gridCoord, keyCoord, row } = this;
		return { col, colKey, gridCoord, keyCoord, row };
	}

	public toGridCoordinate(): GridCoordinate {
		return { col:this.col, row:this.row };
	}

	public toGridTileCoordinate(): GridCoordinate {
		return { col:this.col-1, row:this.row-1 };
	}

	public toJSON(): Coordinate {
		return this.toCoordinate();
	}

	public toKeyCoordinate(): KeyCoordinate {
		const [ col, row ] = [this.colKey, this.row];
		return { col, row };
	}

	/** Example: Coord.from("A", 1); Coord.from(1, 1) */
	public static from(col: string | number, row: number): Coordinate;

	/** Examples: Coord.from({col:1,row:1}); Coord({col:"A",row:1}); Coord.from("A1"); Coord("0,1") */
	public static from(colArg: GridCoordinate | KeyCoordinate | Coordinate | string): Coordinate;

	public static from(colArg: GridCoordinate | KeyCoordinate | Coordinate | string | number, rowArg?: number): Coordinate | undefined {
		// if we have a row, then let's use it
		if (typeof(rowArg) === "number") {
			switch(typeof(colArg)) {
				case "string":
				case "number":
					return new Coord(colArg as number, rowArg);
				default:
					// we should only have string/number cols when we have a row
					debug(`Unexpected colArg type: ${typeof(colArg)}`);
					return undefined;
			}
		}

		// we should never have number cols when we don't have a row
		if (typeof(colArg) === "number") {
			return undefined;
		}

		// let's look for the two coordinate strings we use: grid and key
		if (typeof(colArg) === "string") {
			const gridMatch = (/^(\d+),(\d+)$/).exec(colArg);
			if (gridMatch) {
				return new Coord(+gridMatch[1], +gridMatch[2]);
			}

			const keyMatch = (/^([a-z]+)(\d+)$/i).exec(colArg);
			if (keyMatch) {
				return new Coord(keyMatch[1], +keyMatch[2]);
			}

			debug(`Unexpected colArg format: ${colArg}`);
			return undefined;
		}

		return new Coord(colArg.col as number, colArg.row);
	}

	/** GridTile is 0,0 based. */
	public static toGridTileCoordinate(coord: CoordResolvable): GridCoordinate {
		const { col, row } = Coord.from(coord) ?? { col:1, row:1 };
		return {
			col: col - 1,
			row: row - 1
		};
	}
}

export type CoordResolvable = GridCoordinate | KeyCoordinate | Coordinate | string;

export const parseCoord = Coord.from;
