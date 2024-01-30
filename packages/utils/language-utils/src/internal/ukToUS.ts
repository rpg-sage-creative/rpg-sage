
let _UKtoUS: Map<string, string>;

/**
 * @internal
 * @private
 */
export function getUKtoUS(): Map<string, string> {
	if (!_UKtoUS) {
		_UKtoUS = new Map();
	}
	return _UKtoUS;
}

/**
 * @internal
 * @private
 */
export function ukToUS(uk?: string | null): string | undefined {
	return uk ? _UKtoUS?.get(uk) : undefined;
}

/**
 * @internal
 * @private
 */
export function hasUKtoUS(uk?: string | null): boolean {
	return uk ? _UKtoUS?.has(uk) ?? false : false;
}
