import type { GameSystemCode } from "../../system/GameSystem.js";
import type { Currency, CurrencyCore, DenominationsCore } from "../Currency.js";
import { getDenominations } from "./getDenominations.js";

/**
 * @internal
 * This adds the values of the other Currency to the values of this Currency *WITHOUT* regard for the negative flag.
 * This function assumes you have already figured out if you need to worry about the .neg flags (SEE .add and .subtract).
 */
export function addValues<
	GameSystem extends GameSystemCode,
	DenomKeys extends string,
	Core extends CurrencyCore<GameSystem, DenomKeys> = CurrencyCore<GameSystem, DenomKeys>,
	CurrClass extends Currency<GameSystem, DenomKeys, Core> = Currency<GameSystem, DenomKeys, Core>
>(thisCurrency: CurrClass, otherCurrency: CurrClass): DenominationsCore<DenomKeys> {

	// grab reference to this.core
	const thisCore = { ...thisCurrency.toJSON() };

	// grab reference to other.core
	const otherCore = otherCurrency.toJSON() as DenominationsCore<DenomKeys>;

	// create core to return
	const newValues = { } as DenominationsCore<DenomKeys>;

	// iterate through denominations to do the math and check for negatives
	const denominations = getDenominations<GameSystem, DenomKeys>(thisCurrency);
	denominations.forEach(({ denom }) => {
		const thisValue = thisCore[denom];
		const otherValue = otherCore[denom];

		const newValue = thisValue + otherValue;

		// if we went negative, throw
		if (newValue < 0) {
			throw new RangeError(`addValues should never create a negative value.`);
		}

		newValues[denom] = newValue;
	});

	return newValues;
}