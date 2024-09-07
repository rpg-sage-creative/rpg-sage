import { processMath } from "../math/processMath.js";
import { doStatMath } from "./doStatMath.js";
import { hasStatBlock, replaceStatBlocks } from "./StatBlock.js";
import type { StatsCharacter, StatsCharacterManager, StatsEncounterManager } from "./types.js";

export type ProcessStatsArgs = {
	encounters?: StatsEncounterManager;
	npcs: StatsCharacterManager;
	pcs: StatsCharacterManager;
	pc?: StatsCharacter;
};

export function processStatBlocks(diceString: string, args: ProcessStatsArgs): string;

/** @internal */
export function processStatBlocks(diceString: string, args: ProcessStatsArgs, stack: string[]): string;

export function processStatBlocks(diceString: string, args: ProcessStatsArgs, stack: string[] = []): string {
	if (!hasStatBlock(diceString)) {
		return processMath(diceString, { allowSpoilers:true });
	}

	let replaced = diceString;
	do {
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
					?? undefined;
			}else {
				char = args.pc ?? undefined;
			}

			// get stat
			const statVal = char?.getStat(statKey);
			const statValue = statVal ?? defaultValue ?? "";
			if (statValue.length) {
				return processStatBlocks(statValue, args, stack.concat([stackValue]));
			}

			// return null
			return undefined;
		}, stack);
	}while (hasStatBlock(replaced));

	// ensure any math is handled
	return doStatMath(replaced);
}