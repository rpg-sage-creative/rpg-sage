import type { GameSystemCode } from "../../systems/GameSystem.js";
import type { AnyCurrency, Currency, CurrencyConstructor, CurrencyCore } from "../Currency.js";

export function convertCurrency<
	GameSystem extends GameSystemCode,
	DenomKeys extends string,
	Core extends CurrencyCore<GameSystem, DenomKeys> = CurrencyCore<GameSystem, DenomKeys>,
	CurrClass extends Currency<GameSystem, DenomKeys, Core> = Currency<GameSystem, DenomKeys, Core>,
	CurrConstructor extends CurrencyConstructor<CurrClass, DenomKeys> = CurrencyConstructor<CurrClass, DenomKeys>
>(from: AnyCurrency | undefined, target: CurrConstructor): CurrClass {
	// no value to convert
	if (!from) {
		return new target();
	}

	// same currency can be cloned
	if (from.gameSystem === target.GameSystem) {
		return from.clone() as CurrClass;
	}

	// get target exchange rates that match the from currency
	const exchangeRate = target.CurrencyData.exchangeRates.find(rate => rate.system === from.gameSystem);

	// if we don't have an exchange rate, nothing to convert
	if (!exchangeRate) {
		return new target();
	}

	// force to the default currency
	const valueToConvert = from.toValue();

	// convert to the target default currency
	const convertedValue = valueToConvert * exchangeRate.value;

	// parse the default currency
	return target.parse(convertedValue);
}