import { sum } from "@rsc-utils/core-utils";
import { rollDice } from "@rsc-utils/game-utils";
import { isWholeNumberString } from "../isWholeNumberString.js";

let simpleDiceRegex: RegExp;

/**
 * If the diceString is an integer, that number is returned.
 * Otherwise, returns the results of rolling simple dice: 1d6 or 1d8+1 or 1d10-2.
 * Returns null if the input isn't a valid simple dice roll, or has 0 count or 0 sides.
 */
export function rollDiceString(diceString: string): number | undefined {
	const cleanDiceString = (diceString ?? "").replace(/\s+/g, "");
	if (isWholeNumberString(cleanDiceString)) {
		return +cleanDiceString;
	}

	simpleDiceRegex ??= /^(?<diceSign>[-+])?(?<diceCount>\d+)d(?<diceSides>\d+)(?:(?<modifierSign>[-+])(?<modifier>\d+))?$/i;

	const match = simpleDiceRegex.exec(cleanDiceString);
	if (!match) {
		return undefined;
	}

	const { diceSign, diceCount, diceSides, modifierSign, modifier } = match.groups as Record<string, string | undefined>;

	const val = sum(rollDice(+diceCount!, +diceSides!)) * (diceSign === "-" ? -1 : 1);
	const mod = +(modifier ?? 0) * (modifierSign === "-" ? -1 : 1);
	return val + mod;
}
