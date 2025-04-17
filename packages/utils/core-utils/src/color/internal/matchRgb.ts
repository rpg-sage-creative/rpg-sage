import type { Optional } from "../../types/generics.js";

type Results = {
	red: number;
	green: number;
	blue: number;
	alpha?: number;
};

/**
 * @internal
 * Gets a RegExpMatchArray from the value that includes colors and alpha.
 */
export function matchRgb(value: Optional<string>): Results | undefined {
	if (!value) return undefined; // NOSONAR

	const regex = /rgb(?<rgba>a)?\((?<r>\d{1,3}),(?<g>\d{1,3}),(?<b>\d{1,3})(?:,(?<a>1(?:\.0+)?|0\.\d+))?\)/i;
	const groups = regex.exec(value.replace(/\s/g, ""))?.groups;
	if (!groups) return undefined; // NOSONAR

	const { rgba, r, g, b, a } = groups;

	// make sure alpha is present (or not) as expected
	if (rgba && a === undefined) return undefined; // NOSONAR
	if (!rgba && a !== undefined) return undefined; // NOSONAR

	const red = +r;
	if (red < 0 || red > 255) return undefined; // NOSONAR
	const green = +g;
	if (green < 0 || green > 255) return undefined; // NOSONAR
	const blue = +b;
	if (blue < 0 || blue > 255) return undefined; // NOSONAR

	if (rgba) {
		const alpha = +a;
		if (alpha < 0 || alpha > 1) return undefined; // NOSONAR

		return { red, green, blue, alpha };
	}

	return { red, green, blue };
}
