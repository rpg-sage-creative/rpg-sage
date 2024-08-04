import { registerCharacterWealth } from "./characterWealth.js";
import { registerDCs } from "./dcs.js";

export function registerP20(): void {
	registerCharacterWealth();
	registerDCs();
}