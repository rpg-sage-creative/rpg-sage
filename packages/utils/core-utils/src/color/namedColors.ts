import type { Optional } from "../types/generics.js";
import type { Color } from "./Color.js";

let _namedColors: Map<string, Color>;

/** @internal */
export function getNamedColors(): Map<string, Color> {
	if (!_namedColors) {
		_namedColors = new Map();
	}
	return _namedColors;
}

/** @internal */
export function getNamedColor(key: Optional<string>): Color | undefined {
	return key ? _namedColors?.get(key) : undefined;
}

/** @internal */
export function hasNamedColor(key: Optional<string>): boolean {
	return key ? _namedColors?.has(key) ?? false : false;
}
