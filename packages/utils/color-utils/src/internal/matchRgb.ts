import type { Optional } from "./Optional.js";

/**
 * @internal
 * Gets a RegExpMatchArray from the value that includes colors and alpha.
 */
export function matchRgb(value: Optional<string>): RegExpMatchArray | undefined {
	if (value) {
		const regex = /rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,(1(?:\.0+)?|0\.\d+))?\)/i;
		return regex.exec(value.replace(/\s/g, "")) ?? undefined;
	}
	return undefined;
}
