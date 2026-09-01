import { Ability, type AbilityNameResolvable } from "./Ability.js";

export type HasAbilities<T extends Abilities = Abilities> = { abilities: T; };

export abstract class Abilities {

	//#region Properties

	public get str(): number { return this.getAbilityScore("Strength"); }
	public get strMod(): number { return this.getAbilityScoreModifier("Strength"); }

	public get dex(): number { return this.getAbilityScore("Dexterity"); }
	public get dexMod(): number { return this.getAbilityScoreModifier("Dexterity"); }

	public get con(): number { return this.getAbilityScore("Constitution"); }
	public get conMod(): number { return this.getAbilityScoreModifier("Constitution"); }

	public get int(): number { return this.getAbilityScore("Intelligence"); }
	public get intMod(): number { return this.getAbilityScoreModifier("Intelligence"); }

	public get wis(): number { return this.getAbilityScore("Wisdom"); }
	public get wisMod(): number { return this.getAbilityScoreModifier("Wisdom"); }

	public get cha(): number { return this.getAbilityScore("Charisma"); }
	public get chaMod(): number { return this.getAbilityScoreModifier("Charisma"); }

	//#endregion

	//#region Instance Methods

	/** Gets the Ability Score for the given Ability. */
	public abstract getAbilityScore(ability: AbilityNameResolvable): number;

	/** Gets the Ability Score Modifier for the given Ability. */
	public getAbilityScoreModifier(ability: AbilityNameResolvable): number {
		if (ability) {
			const abilityScore = this.getAbilityScore(ability);
			return Ability.scoreToMod(abilityScore);
		}
		return 0;
	}

	//#endregion
}
