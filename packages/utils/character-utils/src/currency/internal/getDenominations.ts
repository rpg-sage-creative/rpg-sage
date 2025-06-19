import type { GameSystemCode } from "./GameSystemCode.js";
import type { Currency, CurrencyConstructor, CurrencyCore, Denomination, DenominationsCore } from "../Currency.js";

/**
 * @internal
 * Convenient function for getting Denominations from a Currency instance.
 */
export function getDenominations<
	GameSystem extends GameSystemCode,
	DenomKeys extends string,
	Core extends CurrencyCore<GameSystem, DenomKeys> = CurrencyCore<GameSystem, DenomKeys>,
	CurrClass extends Currency<GameSystem, DenomKeys, Core> = Currency<GameSystem, DenomKeys, Core>,
	CurrConstructor extends CurrencyConstructor<CurrClass, DenomKeys> = CurrencyConstructor<CurrClass, DenomKeys>
>(currency: CurrClass): Denomination<DenominationsCore<DenomKeys>>[] {
	const currConstructor = currency.constructor as CurrConstructor;
	return currConstructor.CurrencyData.denominations;
}