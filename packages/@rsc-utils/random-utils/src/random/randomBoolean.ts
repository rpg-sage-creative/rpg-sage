import { randomInt } from "node:crypto";

/** Randomly returns true or a false. Convenience for `crypto.randomInt(2) === 1` */
export function randomBoolean(): boolean {
	return randomInt(2) === 1;
}