import { renameProperty } from "../../validation/index.js";
import type { DiceOptionsV0, DiceOptionsV1 } from "./DiceOptions.js";

export function ensureDiceOptionsV1(core: DiceOptionsV0): DiceOptionsV1 {

	renameProperty({ core, oldKey:"defaultCritMethodType", newKey:"diceCritMethodType" });
	renameProperty({ core, oldKey:"defaultDiceOutput", newKey:"diceOutputType" });
	renameProperty({ core, oldKey:"defaultDiceOutputType", newKey:"diceOutputType" });
	renameProperty({ core, oldKey:"defaultDicePostType", newKey:"dicePostType" });
	renameProperty({ core, oldKey:"defaultDiceSecretMethodType", newKey:"diceSecretMethodType" });

	return core;
}
