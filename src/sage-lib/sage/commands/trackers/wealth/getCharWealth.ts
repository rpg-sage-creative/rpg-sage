import { CharacterShell } from "../../../model/CharacterShell.js";
import { type GameCharacter } from "../../../model/GameCharacter.js";
import { type Wealth } from "./Wealth.js";
import { summarizeWealth } from "./summarizeWealth.js";

export function getCharWealth(char: CharacterShell | GameCharacter, summaryTemplate?: string | null): Wealth {
	const name = char.name;
	const credits = +(char.getStat("credits") ?? 0);
	const pp = +(char.getStat("pp") ?? 0);
	const gp = +(char.getStat("gp") ?? 0);
	const ep = +(char.getStat("ep") ?? 0);
	const sp = +(char.getStat("sp") ?? 0);
	const cp = +(char.getStat("cp") ?? 0);
	const valuables = char.getStat("valuables")?.split(/\s*,\s*/).map(s => s.trim()).filter(s => s) ?? [];
	return summarizeWealth({ name, credits, pp, gp, ep, sp, cp, valuables }, summaryTemplate);
}
