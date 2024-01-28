import type { DiceTestData } from "../DiceTest.js";

/**
 * @internal
 * @private
 */
export type DiceRoll = {
	dice: {
		test?: DiceTestData;
	};
	total: number;
};