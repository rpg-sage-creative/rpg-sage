import type { Optional } from "@rsc-utils/core-utils";
import type { GameSystem } from "@rsc-utils/game-utils";
import type { GameCharacter } from "../sage-lib/sage/model/GameCharacter.js";
import { isStatsKey as isStatsKeyD20, statsToHtml as statsToHtmlD20 } from "./d20/sheets/simpleSheet.js";
import { isStatsKey as isStatsKeyP20, statsToHtml as statsToHtmlP20 } from "./p20/sheets/simpleSheet.js";
import { isStatsKey as isStatsKeySF1e, statsToHtml as statsToHtmlSF1e } from "./sf1e/sheets/simpleSheet.js";

function hasSimpleSheet(gameSystem: Optional<GameSystem>): gameSystem is GameSystem {
	if (gameSystem) {
		return ["D20", "DnD5e", "PF1e", "PF2e", "SF1e", "SF2e"].includes(gameSystem.code);
	}
	return false;
}

function isStatsKey(key: string, gameSystem: Optional<GameSystem>): boolean {
	if (!gameSystem) return false;
	switch(gameSystem.code) {
		case "D20": return isStatsKeyD20(key);
		case "DnD5e": return isStatsKeyD20(key);
		case "PF1e": return isStatsKeyD20(key);
		case "PF2e": return isStatsKeyP20(key);
		case "SF1e": return isStatsKeySF1e(key);
		case "SF2e": return isStatsKeyP20(key);
		default: return false;
	}
}

function statsToHtml(character: GameCharacter, gameSystem?: Optional<GameSystem>): string[] {
	gameSystem ??= character.gameSystem;
	if (!gameSystem) return [];
	switch(gameSystem.code) {
		case "D20": return statsToHtmlD20(character);
		case "DnD5e": return statsToHtmlD20(character);
		case "PF1e": return statsToHtmlD20(character);
		case "PF2e": return statsToHtmlP20(character);
		case "SF1e": return statsToHtmlSF1e(character);
		case "SF2e": return statsToHtmlP20(character);
		default: return [];
	}
}

type Results = {
	/** the keys (stats) used in the template; all lower cased */
	keys: Set<Lowercase<string>>;
	/** the title of the template; generally from getStats(key + ".title") */
	title?: string;
	/** the formatted / processed output */
	lines: string[];
};

export function processSimpleSheet(character: GameCharacter, gameSystem?: Optional<GameSystem>): Results {
	gameSystem ??= character.gameSystem;

	const lines = hasSimpleSheet(gameSystem) ? statsToHtml(character, gameSystem) : [];

	if (!lines?.length) {
		return {
			keys: new Set(),
			title: undefined as string | undefined,
			lines
		};
	}

	const keys = new Set<Lowercase<string>>();
	character.notes.getStats().forEach(note => {
		if (isStatsKey(note.title, gameSystem)) {
			keys.add(note.title.toLowerCase() as Lowercase<string>);
		}
	});

	const title = character.getStat(`simpleSheet.template.title`) ?? `Stats ${gameSystem?.code}`;

	return { keys, title, lines };
}