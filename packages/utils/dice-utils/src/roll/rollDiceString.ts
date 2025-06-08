import { sum } from "@rsc-utils/core-utils";
import { rollDice } from "./rollDice.js";

/**
 * If the diceString is an integer, that number is returned.
 * Otherwise, returns the results of rolling simple dice: 1d6 or 1d8+1 or 1d10-2.
 * Returns null if the input isn't a valid simple dice roll, or has 0 count or 0 sides.
 */
export function rollDiceString(diceString: string): number | undefined {
	const cleanDiceString = (diceString ?? "").replace(/\s+/g, "");
	if (/^\d+$/.test(cleanDiceString)) {
		return +cleanDiceString;
	}

	const regex = /^([-+])?(\d+)d(\d+)(?:([-+])(\d+))?$/i;
	const match = regex.exec(cleanDiceString);
	if (!match) {
		return undefined;
	}

	const diceSign = match[1];
	const diceCount = +match[2];
	const diceSides = +match[3];
	if (!diceCount || !diceSides) {
		return undefined;
	}

	const modifierSign = match[4];
	const modifier = +(match[5] ?? 0);

	const val = sum(rollDice(diceCount, diceSides)) * (diceSign === "-" ? -1 : 1);
	const mod = modifier * (modifierSign === "-" ? -1 : 1);
	return val + mod;
}
