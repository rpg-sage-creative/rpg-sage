import { Ability, type AbilityNameResolvable } from "../../d20/lib/Ability.js";
import type { HephaistosCharacterSF1e } from "../characters/HephaistosCharacter.js";
import { Abilities as AbilitiesSF1e } from "./Abilities.js";

export class HAbilities extends AbilitiesSF1e {
	public constructor(private readonly hc: HephaistosCharacterSF1e) { super(); }

	public getAbilityScore(abilityName: AbilityNameResolvable): number {
		const ability = Ability.findByName(abilityName);
		const { abilityScores } = this.hc.toJSON();
		return abilityScores[ability.key].total;
	}
}
