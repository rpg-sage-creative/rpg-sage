export type HexColorString = `#${string}`;
export type RgbColorString = `rgb(${number},${number},${number})`;
export type RgbaColorString = `rgba(${number},${number},${number},${number})`;

/** @internal */
export type RgbString = RgbColorString | RgbaColorString;

/** Stores all the information we know about a color */
export type ColorData = {
	name?: string;
	lower?: string;
	hex: HexColorString;
	hexa: HexColorString;
	rgb: RgbColorString;
	rgba: RgbaColorString;
	red: number;
	green: number;
	blue: number;
	alpha: number;
};
