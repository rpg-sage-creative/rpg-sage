import type { Optional } from "@rsc-utils/type-utils";
import type { Color } from "./Color.js";

let _namedColors: Map<string, Color>;

/**
 * @internal
 * @private
 */
export function getNamedColors(): Map<string, Color> {
	if (!_namedColors) {
		_namedColors = new Map();
	}
	return _namedColors;
}

/**
 * @internal
 * @private
 */
export function getNamedColor(key: Optional<string>): Color | undefined {
	return key ? _namedColors?.get(key) : undefined;
}

/**
 * @internal
 * @private
 */
export function hasNamedColor(key: Optional<string>): boolean {
	return key ? _namedColors?.has(key) ?? false : false;
}
