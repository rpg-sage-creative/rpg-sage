import { generate } from "./generate";

/** Creates a random number between 1 and the given max (inclusive). */
export function random(max: number): number;
/** Creates a random number between the given min and max (inclusive). */
export function random(min: number, max: number): number;
export function random(minOrMax: number, maxOrOne = 1): number {
	const min = Math.min(minOrMax, maxOrOne);
	const max = Math.max(minOrMax, maxOrOne);
	return min === max ? min : generate(min, max);
}