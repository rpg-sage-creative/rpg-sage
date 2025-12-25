import type { GameSystemCode } from "../../system/GameSystem.js";
import type { Currency, CurrencyCore, DenominationsCore } from "../Currency.js";
import { getDenominations } from "./getDenominations.js";
import { getExchangeRate } from "./getExchangeRate.js";

export function simplifyCurrency<
	GameSystem extends GameSystemCode,
	DenomKeys extends string,
	Core extends CurrencyCore<GameSystem, DenomKeys> = CurrencyCore<GameSystem, DenomKeys>,
	CurrClass extends Currency<GameSystem, DenomKeys, Core> = Currency<GameSystem, DenomKeys, Core>
>(currency: CurrClass, denomKey: DenomKeys): void {

	// get all denominations once
	const denominations = getDenominations<GameSystem, DenomKeys>(currency);

	// get core for direct value manipulation; cast to avoid type issues
	const thisCore = currency.toJSON() as DenominationsCore<DenomKeys>;

	// iterate the denominations
	for (const denomination of denominations) {
		// if we have the given denomKey, convert everything bigger down
		if (denomination.denom === denomKey) {
			denominations.forEach(biggerDenom => {
				if (biggerDenom.value > denomination.value) {
					// the multiplier to get from current denomination to bigger denomination
					const rate = getExchangeRate(biggerDenom, denomination);

					// how many times the rate goes into the bigger amount
					const subtractAmount = thisCore[biggerDenom.denom];

					// how many subtracted from bigger and converted gets added to smaller
					const addAmount = subtractAmount * rate;

					// do the math
					thisCore[biggerDenom.denom] -= subtractAmount;
					thisCore[denomination.denom] += addAmount;
				}
			});

		// otherwise, roll up to the next denomination until we don't have enough to do so
		}else {
			// get next key up
			const biggerDenom = denominations.find(({ value }) => value > denomination.value);
			if (biggerDenom) {
				// the multiplier to get from current denomination to bigger denomination
				const rate = getExchangeRate(biggerDenom, denomination);

				// how many times the rate goes into the bigger amount
				const addAmount = Math.floor(thisCore[denomination.denom] / rate);

				// how many subtracted from bigger and converted gets added to smaller
				const subtractAmount = addAmount * rate;

				// do the math
				thisCore[biggerDenom.denom] += addAmount;
				thisCore[denomination.denom] -= subtractAmount;
			}

		}

	}
}