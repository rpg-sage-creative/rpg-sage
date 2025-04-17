import { readDataFile } from "../internal/readDataFile.js";
import { Color } from "./Color.js";
import type { ColorData, HexColorString } from "./ColorData.js";
import { hexToColor } from "./internal/hexToColor.js";
import { getNamedColors } from "./namedColors.js";

type SimpleColor = { name:string; hex:string; };

/**
 * Loads the named colors used by this repo.
 * By only initializing the data when needed, we can avoid wasted memory when apps don't need it.
 * The number of colors added is returned.
 */
export function intializeNamedColors(filePath?: string): number {
	const namedColors = getNamedColors();
	if (namedColors.size) {
		return 0;
	}

	const rawJson = readDataFile(filePath, "color/namedColors.json");

	const simpleColors: SimpleColor[] = rawJson ? JSON.parse(rawJson) : [];

	simpleColors.forEach((simpleColor: SimpleColor) => {
		const colorCore = hexToColor(simpleColor.hex as HexColorString) as ColorData;
		colorCore.names.push(simpleColor.name);
		const lower = simpleColor.name.toLowerCase();

		const color = new Color(colorCore);

		if (!namedColors.has(colorCore.hexa)) {
			namedColors.set(colorCore.hexa, color);
		}
		namedColors.set(lower, color);
	});

	return namedColors.size;
}
