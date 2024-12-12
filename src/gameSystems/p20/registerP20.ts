import { registerCharacterWealth } from "./characterWealth.js";
import { registerDCs } from "./dcs.js";
import { registerEarnIncome } from "./earnIncome.js";

export function registerP20(): void {
	registerCharacterWealth();
	registerDCs();
	registerEarnIncome();
}