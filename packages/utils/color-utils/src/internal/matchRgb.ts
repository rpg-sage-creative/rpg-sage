import type { Optional } from "@rsc-utils/type-utils";

/**
 * @internal
 * @private
 * Gets a RegExpMatchArray from the value that includes colors and alpha.
 */
export function matchRgb(value: Optional<string>): RegExpMatchArray | null {
	if (value) {
		const regex = /rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,(1(?:\.0+)?|0\.\d+))?\)/i;
		return regex.exec(value.replace(/\s/g, "")) ?? null;
	}
	return null;
}
