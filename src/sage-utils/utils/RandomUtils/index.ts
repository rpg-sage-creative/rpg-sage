import { randomInt } from "crypto";
import type { TSimpleDice } from "./types";

/** Internal generator that doesn't need to figure out min/max values. */
function generate(min: number, max: number): number {
	return randomInt(min, max + 1);
	// return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Creates a random number between 1 and the given max (inclusive). */
export function random(max: number): number;
/** Creates a random number between then given min and max (inclusive). */
export function random(min: number, max: number): number;
export function random(minOrMax: number, maxOrOne = 1): number {
	return generate(Math.min(minOrMax, maxOrOne), Math.max(minOrMax, maxOrOne));
}

/** Randomly returns true or a false. */
export function randomBoolean(): boolean {
	return generate(1, 2) === 2;
}

/**
 * Returns a random value from the array.
 * @param array array of values to select from
 */
export function randomItem<T>(array: T[]): T | null {
	return array.length === 0 ? null : array[generate(1, array.length) - 1];
}

/**
 * Returns an array of non-unique random values from the array.
 * @param array array of values to select from
 * @param count number of random values to choose
 */
export function randomItems<T>(array: T[], count: number): T[];
/**
 * Returns an array of random values from the array.
 * @param array array of values to select from
 * @param count number of random values to choose
 * @param unique if true, the same value (using .includes) will not be selected twice
 */
export function randomItems<T>(array: T[], count: number, unique: boolean): T[];
export function randomItems<T>(array: T[], count: number, unique?: boolean): T[] {
	const selections: T[] = [];
	const total = unique === true ? Math.min(array.length, count) : count;
	if (total > 0) {
		do {
			const randomValue = randomItem(array)!;
			if (!unique || !selections.includes(randomValue)) {
				selections.push(randomValue);
			}
		} while (selections.length < total);
	}
	return selections;
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

	let total = modifier * (modifierSign === "+" ? 1 : -1);
	for (let i = 0; i < diceCount; i++) {
		if (diceSign === "+") {
			total += generate(1, diceSides);
		}else {
			total -= generate(1, diceSides);
		}
	}
	return total;
}

/**
 * Creates a new array by randomly reordering the contents of the given array.
 * Will never return an unshuffled array.
*/
export function shuffle<T>(array: T[]): T[] {
	const shuffled = array.slice();
	do {
		let currentIndex = shuffled.length;
		while (0 !== currentIndex) {
			const randomIndex = generate(1, currentIndex) - 1;
			currentIndex -= 1;
			const temporaryValue = shuffled[currentIndex];
			shuffled[currentIndex] = shuffled[randomIndex];
			shuffled[randomIndex] = temporaryValue;
		}
	}while (!shuffled.find((value, index) => value !== array[index]));
	return shuffled;
}
