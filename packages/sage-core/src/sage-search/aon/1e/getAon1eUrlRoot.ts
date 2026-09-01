import type { Aon1eGameSystemCode } from "./types.js";

export function getAon1eUrlRoot(gameSystem: Aon1eGameSystemCode) {
	return gameSystem === "PF1e"
		? "https://www.aonprd.com/"
		: "https://www.aonsrd.com/";
}