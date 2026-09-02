import type { DenominationsCore } from "../Currency.js";

/** Creates a denominations core and sets all denominations to 0. */
export function createDenomCore<DenomKeys extends string>(denomKeys: DenomKeys[]): DenominationsCore<DenomKeys> {
	const core = {} as DenominationsCore<DenomKeys>;
	denomKeys.forEach(key => core[key] = 0);
	return core;
}