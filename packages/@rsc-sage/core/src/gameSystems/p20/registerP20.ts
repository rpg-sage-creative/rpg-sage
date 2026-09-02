import { registerCharacterWealth } from "./characterWealth.js";
import { registerDCs } from "./dcs.js";
import { registerEarnIncome } from "./earnIncome.js";
import { registerEncounterBuilder } from "./encounterBuilder.js";

export function registerP20(): void {
	registerCharacterWealth();
	registerDCs();
	registerEncounterBuilder();
	registerEarnIncome();
}