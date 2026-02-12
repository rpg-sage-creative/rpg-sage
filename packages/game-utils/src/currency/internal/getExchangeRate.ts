import type { Denomination, DenominationsCore } from "../Currency.js";

/** Calculates the multiplier needed to convert from one currency denomination to another. */
export function getExchangeRate<
	DenomKeys extends string,
	Denom extends Denomination<DenominationsCore<DenomKeys>> = Denomination<DenominationsCore<DenomKeys>>
>(from: Denom, to: Denom): number {
	return from.value / to.value;
}