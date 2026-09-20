import { randomInt as _randomInt } from "node:crypto";

let hasTestRoll = false;
const TestRolls: number[] = [];

/** @internal Used for testing purposes only! */
export function setRandomIntResults(...values: number[]): void {
	TestRolls.length = 0;
	TestRolls.push(...values);
	hasTestRoll = TestRolls.length > 0;
}

/**
 * Ensures min/max are correct before creating the random int.
 * If min and max are the same, that value is returned instead of trying to randomize.
 * Convenience for `crypto.randomInt(Math.min(min, max), Math.max(min, max) + 1)`
 */
export function randomInt(min: number, max: number): number {
	// make sure we have the correct min value and round it
	const minInt = Math.min(min, max);

	// make sure we have the correct max value and round it
	const maxInt = Math.max(min, max);

	// if they are the same, return it
	if (minInt === maxInt) {
		return minInt;
	}

	if (hasTestRoll) {
		const testInt = TestRolls.shift()!;
		/** @todo proper logging */
		console.info(`Popping value ${testInt} for randomInt(${min}, ${max});`);
		hasTestRoll = TestRolls.length > 0;
		if (testInt < minInt || testInt > maxInt) {
			throw new RangeError("Invalid Test Int: " + testInt);
		}
		return testInt;
	}

	// randomly generate a value
	return _randomInt(minInt, maxInt + 1);
}