import { doStatMath } from "./doStatMath.js";
import { hasStatBlock, replaceStatBlocks } from "./StatBlock.js";
import type { StatsCharacter, StatsCharacterManager, StatsEncounterManager } from "./types.js";

export type ProcessStatsArgs = {
	/** optional; no server in dms */
	serverGm?: StatsCharacter;

	/** optional; no game in dms */
	gameGm?: StatsCharacter;

	/** optional; not functional yet (maybe only in games when complete) */
	encounters?: StatsEncounterManager;

	/** game or user npcs (will be empty for users for now) */
	npcs: StatsCharacterManager;

	/** game or user pcs */
	pcs: StatsCharacterManager;

	/** optional; player's primary pc in game */
	pc?: StatsCharacter;
};

export function processStatBlocks(diceString: string, args: ProcessStatsArgs): string;

/** @internal */
export function processStatBlocks(diceString: string, args: ProcessStatsArgs, stack: string[]): string;

export function processStatBlocks(diceString: string, args: ProcessStatsArgs, stack: string[] = []): string {
	let replaced = diceString;
	while (hasStatBlock(replaced)) {
		replaced = replaceStatBlocks(replaced, statBlock => {
			const { charName, isPcType, isAltType, stackValue, statKey, defaultValue } = statBlock;

			// get character
			let char: StatsCharacter | undefined;
			if (isPcType) {
				char = args.pc ?? undefined;
			}else if (isAltType) {
				char = args.pc?.companions?.[0] ?? undefined;
			}else if (charName) {
				char = args.pcs.findByName(charName)
					?? args.pcs.findCompanion(charName)
					?? args.npcs.findByName(charName)
					?? args.npcs.findCompanion(charName)
					?? args.encounters?.findActiveChar(charName)
					?? args.gameGm?.companions?.findByName(charName)
					?? args.serverGm?.companions?.findByName(charName)
					?? undefined;
			}else {
				char = args.pc ?? undefined;
			}

			// get stat
			let statVal: string | undefined;
			if (char) {
				// we have a character, get the stat
				statVal = char.getString(statKey);

			}else if (charName?.toLowerCase() === "gm") {
				// we didn't find a character, try the built in gmCharacters
				statVal = args.gameGm?.getString(statKey) ?? args.serverGm?.getString(statKey);
			}

			// process stat or default
			const statValue = statVal ?? defaultValue ?? "";
			if (statValue.length) {
				return processStatBlocks(statValue, args, stack.concat([stackValue]));
			}

			// return null
			return undefined;
		}, stack);
	}

	// ensure any math is handled
	return doStatMath(replaced);
}