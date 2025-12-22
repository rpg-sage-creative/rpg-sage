import type { Optional } from "@rsc-utils/core-utils";
import type { StatBlockProcessor } from "@rsc-utils/dice-utils";
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

function isStatsKey(key: string, gameSystem: GameSystem): boolean {
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

function statsToHtml(processor: StatBlockProcessor, gameSystem: GameSystem): string[] {
	switch(gameSystem.code) {
		case "D20": return statsToHtmlD20(processor);
		case "DnD5e": return statsToHtmlD20(processor);
		case "PF1e": return statsToHtmlD20(processor);
		case "PF2e": return statsToHtmlP20(processor);
		case "SF1e": return statsToHtmlSF1e(processor);
		case "SF2e": return statsToHtmlP20(processor);
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

type Args = {
	char: GameCharacter;
	processor: StatBlockProcessor;
	gameSystem?: Optional<GameSystem>;
};

export function processSimpleSheet({ char, processor, gameSystem }: Args): Results {
	gameSystem ??= char.gameSystem;

	// if not a valid game system, stop processing here
	if (!hasSimpleSheet(gameSystem)) {
		return {
			keys: new Set(),
			title: undefined as string | undefined,
			lines: []
		};
	}

	// process the stats
	const lines = statsToHtml(processor, gameSystem);

	// if we got nothing back, stop processing here
	if (!lines?.length) {
		return {
			keys: new Set(),
			title: undefined as string | undefined,
			lines
		};
	}

	// track all the keys used
	const keys = new Set<Lowercase<string>>();
	char.notes.getStats().forEach(note => {
		if (isStatsKey(note.title, gameSystem)) {
			keys.add(note.title.toLowerCase() as Lowercase<string>);
		}
	});

	// get the custom title if one exists
	const title = char.getString(`simpleSheet.template.title`) ?? `Stats ${gameSystem?.code}`;

	return { keys, title, lines };
}