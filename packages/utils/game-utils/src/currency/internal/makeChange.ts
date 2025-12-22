import type { GameSystemCode } from "../../systems/GameSystem.js";
import type { Currency, CurrencyCore, Denomination, DenominationsCore } from "../Currency.js";
import { getDenominations } from "./getDenominations.js";
import { getExchangeRate } from "./getExchangeRate.js";

type ChangeArgs<
	DenomKeys extends string,
	DenomCore extends DenominationsCore<DenomKeys> = DenominationsCore<DenomKeys>,
	Denom extends Denomination<DenomCore> = Denomination<DenomCore>
> = {
	denominations: Denom[];
	denom: DenomKeys;
	needed: number;
	thisCore: DenomCore;
	thisDenom: Denom;
};

function changeFromBigger<
	DenomKeys extends string
>({ denom, denominations, needed, thisCore, thisDenom }: ChangeArgs<DenomKeys>): void {

	// bigger denoms convert multiple thisDenom from one bigger denom
	const biggerDenoms = denominations.filter(({ value }) => value > thisDenom.value);

	// do them from smallest to biggest (the EXPECTED order of denominations)
	for (const biggerDenom of biggerDenoms) {
		const rate = getExchangeRate(biggerDenom, thisDenom);
		while (thisCore[denom] < needed) {
			// if this denom has a 0, let's go up again to make change for this one so we can make change for the one we actually need
			if (thisCore[biggerDenom.denom] === 0) {
				changeFromBigger({ denom:biggerDenom.denom, denominations, needed:1, thisCore, thisDenom:biggerDenom });
			}

			// now we can try to make change for the requested denom
			if (thisCore[biggerDenom.denom] > 0) {
				thisCore[biggerDenom.denom]--;
				thisCore[denom] += rate;

			}else {
				// if we can't make change then let's break the loop
				break;
			}
		}
	}
}

function changeFromSmaller<
	DenomKeys extends string
>({ denom, denominations, needed, thisCore, thisDenom }: ChangeArgs<DenomKeys>): void {

	// smaller denoms convert one thisDenom from multiple smaller denoms
	const smallerDenoms = denominations.filter(({ value }) => value < thisDenom.value);

	// do them from biggest to smallest (the REVERSE of the expected order of denominations)
	smallerDenoms.reverse();
	for (const smallerDenom of smallerDenoms) {
		const rate = getExchangeRate(thisDenom, smallerDenom);
		while (thisCore[smallerDenom.denom] >= rate && thisCore[denom] < needed) {
			thisCore[smallerDenom.denom] -= rate;
			thisCore[denom]++;
		}
	}
}

/**
 * @internal
 * Makes change for the given Denomination of the given Currency.
 * Returns the new value for the given denomination.
 */
export function makeChange<
	GameSystem extends GameSystemCode,
	DenomKeys extends string,
	Core extends CurrencyCore<GameSystem, DenomKeys>,
	CurrClass extends Currency<GameSystem, DenomKeys, Core>
>(thisCurrency: CurrClass, denom: DenomKeys, needed: number): number {

	// get all denominations once
	const denominations = getDenominations<GameSystem, DenomKeys>(thisCurrency);

	// get core for direct value manipulation; cast to avoid type issues
	const thisCore = thisCurrency.toJSON() as DenominationsCore<DenomKeys>;

	// needed for all logic
	const thisDenom = denominations.find(denomination => denomination.denom === denom)!;

	// try making change from bigger denom first
	changeFromBigger({ denominations, denom, needed, thisCore, thisDenom });

	// if we still need change, let's try changing smaller denoms up
	if (thisCore[denom] < needed) {
		changeFromSmaller({ denominations, denom, needed, thisCore, thisDenom });
	}

	return thisCore[denom];
}