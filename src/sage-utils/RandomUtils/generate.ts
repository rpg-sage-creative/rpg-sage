import { randomInt } from "crypto";

/** @todo is there any reason to consider different ways of generating random numbers? */
// return Math.floor(Math.random() * (max - min + 1)) + min;

/** Internal generator that doesn't need to figure out min/max values. */
export function generate(min: number, max: number): number {
	return randomInt(min, max + 1);
}
