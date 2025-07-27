import { addCommas } from "@rsc-utils/core-utils";
import type { GameSystemCode } from "../../systems/GameSystem.js";
import type { Currency, CurrencyCore, DenominationsCore } from "../Currency.js";
import { getDenominations } from "./getDenominations.js";

export function formatCurrency<
	GameSystem extends GameSystemCode,
	DenomKeys extends string,
	Core extends CurrencyCore<GameSystem, DenomKeys> = CurrencyCore<GameSystem, DenomKeys>,
	CurrClass extends Currency<GameSystem, DenomKeys, Core> = Currency<GameSystem, DenomKeys, Core>
>(currency: CurrClass, denomKey?: DenomKeys): string {

	// get currency core
	const currCore = currency.toJSON() as DenominationsCore<DenomKeys>;

	// get denominations; we display them biggest to smallest, so reverse them
	const denominations = getDenominations<GameSystem, DenomKeys>(currency).slice().reverse();

	// get the target denomination
	const thisDenom = denominations.find(({ denom }) => denom === denomKey) ?? denominations[0];

	// create core for temp math
	const newValues = { } as DenominationsCore<DenomKeys>;

	// copy values to newValues, rolling over larger denominations not being displayed
	let rolledOver = 0;
	denominations.forEach(({ denom, value }) => {
		// check if we are rolling any value over
		if (denomKey && value > thisDenom.value) {
			// convert to default denomination and add to rollover
			rolledOver += currCore[denom] * value;
		}else {
			// set the value for this denom
			newValues[denom] = currCore[denom];
			// if we have rollover, then add it as well
			if (rolledOver > 0) {
				// convert to the current denomination and add
				newValues[denom] += rolledOver / value;
				// reset rollover
				rolledOver = 0;
			}
		}
	});

	// get the parts of the output for each denomination
	const parts: string[] = [];
	denominations.forEach(({ denom }) => {
		if (newValues[denom]) {
			parts.push(`${addCommas(newValues[denom])} ${denom}`);
		}
	});

	const negOut = currency.neg ? "-" : "";
	const partsOut = parts.join(", ");

	return `${negOut}${partsOut}`;
}