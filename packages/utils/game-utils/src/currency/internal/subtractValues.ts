import type { GameSystemCode } from "../../systems/GameSystem.js";
import type { Currency, CurrencyCore, DenominationsCore } from "../Currency.js";
import { getDenominations } from "./getDenominations.js";
import { makeChange } from "./makeChange.js";

/**
 * @internal
 * This subtracts the values of the other Currency from the values of this Currency *WITHOUT* regard for the negative flag.
 * This function assumes you have already figured out if you need to worry about the .neg flags and which value is larger so that you are subtracting the smaller from the larger (SEE .add and .subtract).
 * If a denomination doesn't have enough value to stay positive, then change is made.
 * If the subtraction would result in a negative number, than a RangeError is thrown and no subtraction takes place.
 */
export function subtractValues<
			GameSystem extends GameSystemCode,
			DenomKeys extends string,
			Core extends CurrencyCore<GameSystem, DenomKeys> = CurrencyCore<GameSystem, DenomKeys>,
			CurrClass extends Currency<GameSystem, DenomKeys, Core> = Currency<GameSystem, DenomKeys, Core>
		>(thisCurrency: CurrClass, otherCurrency: CurrClass): DenominationsCore<DenomKeys> {

	// clone thisCurrency to allow us to edit it while passing to makeChange
	const thisClone = thisCurrency.clone();

	// grab reference to this.core
	const thisCore = thisClone.toJSON();

	// grab reference to other.core
	const otherCore = otherCurrency.toJSON() as DenominationsCore<DenomKeys>;

	// create core to return
	const newValues = { } as DenominationsCore<DenomKeys>;

	// iterate through denominations to do the math and check for negatives
	const denominations = getDenominations<GameSystem, DenomKeys>(thisCurrency);
	denominations.forEach(({ denom }) => {
		let thisValue = thisCore[denom];
		const otherValue = otherCore[denom];

		// to ensure we don't get a negative number, we make change
		if (thisValue < otherValue) {
			makeChange(thisClone, denom, otherValue);
			// get thisValue again now that it has changed
			thisValue = thisCore[denom];
		}

		const newValue = thisValue - otherValue;

		// if we went negative, throw
		if (newValue < 0) {
			throw new RangeError(`subtractValues should never create a negative value.`);
		}

		newValues[denom] = newValue;
	});

	return newValues;
}