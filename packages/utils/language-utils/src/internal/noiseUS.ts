import type { Optional } from "@rsc-utils/type-utils";

let _noiseUS: Set<string>;

/**
 * @internal
 * @private
 */
export function getNoiseUS(): Set<string> {
	if (!_noiseUS) {
		_noiseUS = new Set();
	}
	return _noiseUS;
}

/**
 * @internal
 * @private
 */
export function isNoiseUS(word: Optional<string>): boolean {
	return word ? _noiseUS?.has(word) ?? false : false;
}
