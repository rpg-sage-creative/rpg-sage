/*
The concept here is to allow complex combinations.
	ex: [ 10d6 dl3 x6 kh5 lt2 ]
	1. roll 10d6
	2. drop lowest 3
	3. explode any values of 6
	4. keep highest 5
	5. lowest threshold 2
*/

import type { DiceDropKeep } from "./DiceDropKeep.js";
import type { DiceExplode } from "./DiceExplode.js";
import type { DiceThreshold } from "./DiceThreshold.js";

export type DiceManipulationData = {
	dropKeep?: DiceDropKeep;
	explode?: DiceExplode;
	noSort?: boolean;
	threshold?: DiceThreshold;
};
