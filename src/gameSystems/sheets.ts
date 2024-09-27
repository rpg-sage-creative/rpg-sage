import type { GameSystem } from "@rsc-sage/types";
import type { Optional } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../sage-lib/sage/model/GameCharacter";
import { isStatsKey as isStatsKeyD20, statsToHtml as statsToHtmlD20 } from "./d20/sheets/simpleSheet.js";
import { isStatsKey as isStatsKeyP20, statsToHtml as statsToHtmlP20 } from "./p20/sheets/simpleSheet.js";
import { isStatsKey as isStatsKeySF1e, statsToHtml as statsToHtmlSF1e } from "./sf1e/sheets/simpleSheet.js";

export function canProcessStats(gameSystem: Optional<GameSystem>): boolean {
	if (gameSystem) {
		return ["DnD5e", "PF1e", "PF2e", "SF1e", "SF2e"].includes(gameSystem.code);
	}
	return false;
}

export function isStatsKey(key: string, gameSystem: Optional<GameSystem>): boolean {
	if (!gameSystem) return false;
	switch(gameSystem.code) {
		case "DnD5e": return isStatsKeyD20(key);
		case "PF1e": return isStatsKeyD20(key);
		case "PF2e": return isStatsKeyP20(key);
		case "SF1e": return isStatsKeySF1e(key);
		case "SF2e": return isStatsKeyP20(key);
		default: return false;
	}
}

export function statsToHtml(character: GameCharacter, gameSystem: Optional<GameSystem>): string[] {
	if (!gameSystem) return [];
	switch(gameSystem.code) {
		case "DnD5e": return statsToHtmlD20(character);
		case "PF1e": return statsToHtmlD20(character);
		case "PF2e": return statsToHtmlP20(character);
		case "SF1e": return statsToHtmlSF1e(character);
		case "SF2e": return statsToHtmlP20(character);
		default: return [];
	}
}