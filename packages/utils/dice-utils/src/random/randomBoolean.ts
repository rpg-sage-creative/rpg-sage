import { randomInt } from "./randomInt.js";

/** Randomly returns true or a false. */
export function randomBoolean(): boolean {
	return randomInt(1, 2) === 2;
}