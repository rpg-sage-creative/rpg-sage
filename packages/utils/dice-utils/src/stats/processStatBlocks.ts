import { doStatMath } from "./doStatMath.js";
import { hasStatBlock, replaceStatBlocks } from "./StatBlock.js";
import type { StatsCharacter, StatsCharacterManager, StatsEncounterManager } from "./types.js";

export type ProcessStatsArgs = {
	encounters?: StatsEncounterManager;
	npcs: StatsCharacterManager;
	pcs: StatsCharacterManager;
	pc?: StatsCharacter | null;
};

export function processStatBlocks(diceString: string, args: ProcessStatsArgs): string;

/** @internal */
export function processStatBlocks(diceString: string, args: ProcessStatsArgs, stack: string[]): string;

export function processStatBlocks(diceString: string, args: ProcessStatsArgs, stack: string[] = []): string {
	if (!hasStatBlock(diceString)) return diceString; // NOSONAR

	let replaced = diceString;
	do {
		replaced = replaceStatBlocks(replaced, statBlock => {
			const { charName, isPcType, isAltType, stackValue, statKey, defaultValue } = statBlock;

			// get character
			let char: StatsCharacter | null = null;
			if (isPcType) {
				char = args.pc ?? null;
			}else if (isAltType) {
				char = args.pc?.companions?.[0] ?? null;
			}else if (charName) {
				char = args.pcs.findByName(charName)
					?? args.pcs.findCompanion(charName)
					?? args.npcs.findByName(charName)
					?? args.npcs.findCompanion(charName)
					?? args.encounters?.findActiveChar(charName)
					?? null;
			}else {
				char = args.pc ?? null;
			}

			// get stat
			const statVal = char?.getStat(statKey);
			const statValue = statVal ?? defaultValue ?? "";
			if (statValue.length) {
				return processStatBlocks(statValue, args, stack.concat([stackValue]));
			}

			// return null
			return null;
		}, stack);
	}while (hasStatBlock(replaced));

	// ensure any math is handled
	return doStatMath(replaced);
}