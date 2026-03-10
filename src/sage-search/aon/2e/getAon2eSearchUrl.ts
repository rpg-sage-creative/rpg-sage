import type { Aon2eGameSystemCode } from "./types.js";

export function getAon2eSearchUrl(gameSystem: Aon2eGameSystemCode) {
	return gameSystem === "PF2e"
		? "https://elasticsearch.aonprd.com/aon/_search"
		: "https://elasticsearch.aonprd.com/aonsf/_search";
}