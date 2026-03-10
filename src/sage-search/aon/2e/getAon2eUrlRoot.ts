import type { Aon2eGameSystemCode } from "./types.js";

export function getAon2eUrlRoot(gameSystem: Aon2eGameSystemCode) {
	return gameSystem === "PF2e"
		? "https://2e.aonprd.com/"
		: "https://2e.aonsrd.com/";
}