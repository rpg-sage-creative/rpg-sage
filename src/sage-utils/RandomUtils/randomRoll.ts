import { random } from "./random";

/** Simple dice string formats in the form of XdY+-Z */
export type TSimpleDice =
	`${number}d${number}`
	| `-${number}d${number}`
	| `+${number}d${number}`
	| `${number}d${number}-${number}`
	| `${number}d${number}+${number}`
	| `-${number}d${number}-${number}`
	| `-${number}d${number}+${number}`
	| `+${number}d${number}-${number}`
	| `+${number}d${number}+${number}`
	;

/**
 * Sets the positive number's +/- sign to the given sign (used for adding to a total).
 */
function sign(value: number, sign: string): number {
	return sign === "+" ? +value : -value;
}

/**
 * Returns the results of rolling simple dice: 1d6 or 1d8+1 or 1d10-2.
 * Returns null if the input isn't a valid simple dice roll, or has 0 count or 0 sides.
 */
export function randomRoll(diceString: TSimpleDice): number | null {
	const cleanDiceString = (diceString ?? "").replace(/\s+/, "");
	const match = cleanDiceString.match(/^([\-\+])?(\d+)d(\d+)(?:([\-\+])(\d+))?$/i);
	if (!match) {
		return null;
	}

	const diceSign = match[1] ?? "+";
	const diceCount = +match[2];
	const diceSides = +match[3];
	if (!diceCount || !diceSides) {
		return null;
	}

	const modifierSign = match[4] ?? "+";
	const modifier = +(match[5] ?? 0);

	let total = sign(modifier, modifierSign);
	for (let i = 0; i < diceCount; i++) {
		total += sign(random(diceSides), diceSign);
	}
	return total;
}