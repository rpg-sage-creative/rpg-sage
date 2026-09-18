
let _UKtoUS: Map<string, string>;

/** @internal */
export function getUKtoUS(): Map<string, string> {
	return _UKtoUS ??= new Map();
}

/** @internal */
export function ukToUS(uk?: string | null): string | undefined {
	return uk ? _UKtoUS?.get(uk) : undefined;
}

/** @internal */
export function hasUKtoUS(uk?: string | null): boolean {
	return uk ? _UKtoUS?.has(uk) ?? false : false;
}
