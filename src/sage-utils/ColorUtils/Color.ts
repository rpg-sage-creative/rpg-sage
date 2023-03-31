import { round } from "../NumberUtils";

/** Stores all the information we know about a color */
export type ColorCore = {
	name?: string;
	lower?: string;
	hex: string;
	hexa: string;
	rgb: string;
	rgba: string;
	red: number;
	green: number;
	blue: number;
	alpha: number;
};


//#region type checking

function isNumber(value: any): value is number {
	return typeof(value) === "number";
}

function isColorCore(value: any): value is ColorCore {
	return typeof(value) === "object";
}

//#endregion

// #region value converters

/** Converts a decimal number (between 0-1) alpha to Hex */
function alphaToHex(value: number | undefined): string {
	return numberToHex(Math.floor((value ?? 1) * 255));
}

/** Converts a Hex based alpha to a decimal number (between 0-1) value */
function hexToAlpha(value: string): number {
	return round(parseInt(value, 16) / 255, 3);
}

/** Converts a whole number (0-255) to Hex */
function numberToHex(value: number): string {
	return value.toString(16).padStart(2, "0");
}

// #endregion

// #region hex parsing

/** Gets a RegExpMatchArray from the value that includes color and alpha */
function matchHex(value: string): RegExpMatchArray | null {
	return value?.trim()
		.toUpperCase()
		.match(/^(?:0X|#)?((?:[0-9A-F]{3}){1,2})([0-9A-F]{1,2})?$/)
		?? null;
}

/** Parses the value to get a full Hex value with alpha: #002244FF */
function parseHexa(value: string): string | null {
	const match = matchHex(value);
	if (!match) {
		return null;
	}
	let hex = match[1],
		alpha = match[2] || "FF";
	if (hex.length === 3) {
		hex = hex[0] + hex[0] +hex[1] + hex[1] +hex[2] + hex[2];
	}
	if (alpha.length === 1) {
		alpha = alpha + alpha;
	}
	return `#${hex}${alpha}`;
}

// #endregion

// #region rgb/rgba parsing

/** Simple type to store r/g/b/a values */
type TRgba = { red:number, green:number, blue:number, alpha?:number };

/** Gets a RegExpMatchArray from the value that includes colors and alpha */
function matchRgba(value: string): RegExpMatchArray | null {
	return value?.replace(/\s/g, "")
		.match(/rgba?\((\d+),(\d+),(\d+)(?:,(1(?:\.0+)?|0\.\d+))?\)/i)
		?? null;
}

/** Parses the value to get all the r/g/b/a component values */
function parseRgba(value: string): TRgba | null {
	const match = matchRgba(value);
	if (!match) {
		return null;
	}
	return {
		red: +match[1],
		green: +match[2],
		blue: +match[3],
		alpha: match[4] === undefined ? undefined : round(+match[4], 3)
	};
}

// #endregion

// #region rgb to hex converters

function _rgbaToHexa(red: number, green: number, blue: number, alpha?: number): string {
	return `#${numberToHex(red)}${numberToHex(green)}${numberToHex(blue)}${alphaToHex(alpha)}`;
}

function rgbToHexa(rgb: string): string;
function rgbToHexa(rgb: string, newAlpha: number): string;
function rgbToHexa(red: number, green: number, blue: number): string;
function rgbToHexa(rgbOrRed: string | number, alphaOrGreen?: number, blue?: number): string | null {
	if (isNumber(rgbOrRed)) {
		return _rgbaToHexa(rgbOrRed, alphaOrGreen!, blue!);
	}
	const rgb = parseRgba(rgbOrRed);
	return rgb ? _rgbaToHexa(rgb.red, rgb.green, rgb.blue, alphaOrGreen) : null;
}

function rgbaToHexa(rgba: string): string;
function rgbaToHexa(rgba: string, newAlpha: number): string;
function rgbaToHexa(red: number, green: number, blue: number): string;
function rgbaToHexa(red: number, green: number, blue: number, alpha: number): string;
function rgbaToHexa(rgbaOrRed: string | number, alphaOrGreen?: number, blue?: number, alpha?: number): string | null {
	if (isNumber(rgbaOrRed)) {
		if (alpha !== undefined) {
			return _rgbaToHexa(rgbaOrRed, alphaOrGreen!, blue!, alpha);
		}else {
			return _rgbaToHexa(rgbaOrRed, alphaOrGreen!, blue!);
		}
	}
	const rgba = parseRgba(rgbaOrRed);
	return rgba ? _rgbaToHexa(rgba.red, rgba.green, rgba.blue, alphaOrGreen ?? rgba.alpha) : null;
}

// #endregion

// #region color converters

/** Converts a hex/hexa value (with optional new alpha) to a Color object */
export function hexToColor(value: string, alpha?: number): ColorCore | null {
	let hexa = parseHexa(value);
	if (!hexa) {
		return null;
	}

	const hex = hexa?.slice(0, 7);
	if (hex && alpha !== undefined) {
		hexa = hex + alphaToHex(alpha);
	}

	const color = NAMED_COLORS.get(hexa);
	if (color) {
		return color.core;
	}

	alpha = round(hexToAlpha(hexa.slice(-2)), 3);

	const red = parseInt(hexa.slice(1, 3), 16),
		green = parseInt(hexa.slice(3, 5), 16),
		blue = parseInt(hexa.slice(5, 7), 16);

	return {
		name: undefined,
		lower: undefined,
		hexa: hexa,
		hex: hex,
		rgba: `rgba(${red},${green},${blue},${alpha})`,
		rgb: `rgb(${red},${green},${blue})`,
		red: red,
		green: green,
		blue: blue,
		alpha: alpha
	};
}

/** Converts any given values to Hex and then to a Color object */
function toColorCore(color: string): ColorCore;
function toColorCore(color: string, alpha: number): ColorCore;
function toColorCore(color: ColorCore, alpha: number): ColorCore;
function toColorCore(red: number, green: number, blue: number): ColorCore;
function toColorCore(red: number, green: number, blue: number, alpha: number): ColorCore;
function toColorCore(colorOrRed: string | number | ColorCore, alphaOrGreen?: number, blue?: number, alpha?: number): ColorCore | null {
	if (isNumber(colorOrRed)) {
		if (alpha !== undefined) {
			return hexToColor(rgbaToHexa(colorOrRed, alphaOrGreen!, blue!, alpha));
		}else {
			return hexToColor(rgbToHexa(colorOrRed, alphaOrGreen!, blue!));
		}
	}else if (isColorCore(colorOrRed)) {
		return hexToColor(colorOrRed.hexa, alphaOrGreen);
	}

	const namedColor = NAMED_COLORS.get(colorOrRed?.toLowerCase());
	if (namedColor) {
		return hexToColor(namedColor.hexa, alphaOrGreen);
	}

	if (Color.isHexa(colorOrRed)) {
		return hexToColor(colorOrRed, alphaOrGreen);
	}
	if (Color.isRgba(colorOrRed)) {
		return hexToColor(rgbaToHexa(colorOrRed), alphaOrGreen);
	}

	return null;
}

// #endregion

// #region helper converters to specific color value types

// /** Converts any given values to Hex with alpha */
// function toHexa(colorOrRed: string | number, alphaOrGreen: number, blue: number, alpha: number): string {
// 	const color = toColorCore(colorOrRed as number, alphaOrGreen, blue, alpha);
// 	return color && color.hexa || null;
// }

// /** Converts any given values to Hex without alpha */
// function toHex(colorOrRed: string | number, alphaOrGreen: number, blue: number, alpha: number): string {
// 	const color = toColorCore(colorOrRed as number, alphaOrGreen, blue, alpha);
// 	return color && color.hex || null;
// }

// /** Converts any given values to long number color value */
// function toInt(colorOrRed: string | number, alphaOrGreen: number, blue: number, alpha: number): number {
// 	const color = toColorCore(colorOrRed as number, alphaOrGreen, blue, alpha);
// 	return color && color.int || null;
// }

// /** Converts any given values to a known color name */
// function toName(colorOrRed: string | number, alphaOrGreen: number, blue: number, alpha: number): string {
// 	const color = toColorCore(colorOrRed as number, alphaOrGreen, blue, alpha);
// 	return color && color.name || null;
// }

// /** Converts any given values to RGB color without alpha */
// function toRgb(colorOrRed: string | number, alphaOrGreen: number, blue: number, alpha: number): string {
// 	const color = toColorCore(colorOrRed as number, alphaOrGreen, blue, alpha);
// 	return color && color.rgb || null;
// }

// /** Converts any given values to RGBA color (with alpha) */
// function toRgba(colorOrRed: string | number, alphaOrGreen: number, blue: number, alpha: number): string {
// 	const color = toColorCore(colorOrRed as number, alphaOrGreen, blue, alpha);
// 	return color && color.rgba || null;
// }

// #endregion

type VALID_COLOR = string & { valid_color:never; }

export const NAMED_COLORS: Map<string, Color> = new Map();

export class Color {
	// #region public properties
	public get name(): string | undefined { return this.core.name; }
	public get hex(): string { return this.core.hex; }
	public get hexa(): string { return this.core.hexa; }
	public get rgb(): string { return this.core.rgb; }
	public get rgba(): string { return this.core.rgba; }
	public get red(): number { return this.core.red; }
	public get green(): number { return this.core.green; }
	public get blue(): number { return this.core.blue; }
	public get alpha(): number { return this.core.alpha; }
	// #endregion

	public constructor(public core: ColorCore) { }

	public toDiscordColor(): string { return "0x" + this.hex.slice(1); }

	// #region color manipulation

	public darken(): Color;
	public darken(increment: number): Color;
	public darken(increment = 16): Color {
		const red = Math.max(0, this.red - increment),
			green = Math.max(0, this.green - increment),
			blue = Math.max(0, this.blue - increment);
		return Color.from(red, green, blue, this.alpha);
	}

	public lighten(): Color;
	public lighten(increment: number): Color;
	public lighten(increment = 16): Color {
		const red = Math.min(255, this.red + increment),
			green = Math.min(255, this.green + increment),
			blue = Math.min(255, this.blue + increment);
		return Color.from(red, green, blue, this.alpha);
	}

	public tweakAlpha(multiplier: number): Color {
		return Color.from(this.core, this.alpha * multiplier);
	}

	// #endregion

	public static from(color: string): Color;
	public static from(color: string, alpha: number): Color;
	public static from(color: ColorCore, alpha: number): Color;
	public static from(red: number, green: number, blue: number): Color;
	public static from(red: number, green: number, blue: number, alpha: number): Color;
	public static from(colorOrRed: string | number | ColorCore, alphaOrGreen?: number, blue?: number, alpha?: number): Color | null {
		const color = toColorCore(colorOrRed as number, alphaOrGreen as number, blue as number, alpha as number);
		return color ? new Color(color) : null;
	}

	// #region "is" tests

	/** Tests all color types in this module */
	public static isValid(color: string): color is VALID_COLOR {
		return Color.isHexa(color) || Color.isRgba(color);
	}

	/** Tests explicitly for Hex without alpha */
	public static isHex(color: string): boolean {
		const match = matchHex(color);
		return match !== null && match[2] === undefined;
	}

	/** Tests explicitly for Hex with alpha */
	public static isHexa(color: string): boolean {
		return matchHex(color) !== null;
	}

	/** Tests to see if the named color exists */
	public static isName(color: string): boolean {
		return NAMED_COLORS.has(color.toLowerCase());
	}

	/** Tests explicitly for RGB without alpha */
	public static isRgb(color: string): boolean {
		const match = matchRgba(color);
		return match !== null && match[4] === undefined;
	}

	/** Tests explicitly for RGB with alpha */
	public static isRgba(color: string) {
		return matchRgba(color) !== null;
	}

	// #endregion

}
