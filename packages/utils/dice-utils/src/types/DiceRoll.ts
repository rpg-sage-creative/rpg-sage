import type { DiceTestData } from "../DiceTest.js";

/**
 * @internal
 */
export type DiceRoll = {
	dice: {
		test?: DiceTestData;
	};
	total: number;
};