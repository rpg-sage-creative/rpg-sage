
let _noiseUS: Set<string>;

/** @internal */
export function getNoiseUS(): Set<string> {
	if (!_noiseUS) {
		_noiseUS = new Set();
	}
	return _noiseUS;
}

/** @internal */
export function isNoiseUS(word?: string | null): boolean {
	return word ? _noiseUS?.has(word) ?? false : false;
}
