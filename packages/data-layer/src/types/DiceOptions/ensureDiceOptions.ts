import { renameProperty } from "../../validation/index.js";
import type { DiceOptionsOld, DiceOptions } from "./DiceOptions.js";

export function ensureDiceOptions(core: DiceOptionsOld): DiceOptions {

	renameProperty({ core, oldKey:"defaultCritMethodType", newKey:"diceCritMethodType" });
	renameProperty({ core, oldKey:"defaultDiceOutput", newKey:"diceOutputType" });
	renameProperty({ core, oldKey:"defaultDiceOutputType", newKey:"diceOutputType" });
	renameProperty({ core, oldKey:"defaultDicePostType", newKey:"dicePostType" });
	renameProperty({ core, oldKey:"defaultDiceSecretMethodType", newKey:"diceSecretMethodType" });

	return core;
}
