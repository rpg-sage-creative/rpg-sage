import type { Optional } from "@rsc-utils/core-utils";
import { Abilities } from "../../d20/lib/Abilities.js";
import { Ability, type AbilityAbbr, type AbilityAbbrKey, type AbilityKey, type AbilityName } from "../../d20/lib/Ability.js";
import { Check } from "./Check.js";

export interface IHasAbilitiesP20 { abilities: AbilitiesP20; }

export abstract class AbilitiesP20 extends Abilities {

	//#region Properties

	public get keyAbility(): AbilityName | undefined { return this.getKeyAbility(); }

	//#endregion

	//#region Instance Methods

	/** Create a Check for the given ability. */
	public getCheck(ability: AbilityName | AbilityAbbr | AbilityKey | AbilityAbbrKey): Check;
	public getCheck(ability: Optional<string>): Check | undefined;
	public getCheck(abilityName: Optional<string>): Check | undefined {
		const ability = Ability.findByName(abilityName);
		if (!ability) return undefined;

		const modifier = this.getAbilityScoreModifier(ability.name);

		const check = new Check(null!, ability.name);
		check.abilityModifier = { ability:ability.name, modifier };
		return check;
	}

	/** Gets the Key Ability for the given Class. */
	public abstract getKeyAbility(className?: string): AbilityName | undefined;

	/** Get the Ability Score Modifier for the given Class. */
	public getKeyAbilityScoreModifier(className?: string): number {
		const keyAbility = this.getKeyAbility(className);
		if (!keyAbility) return 0;
		return this.getAbilityScoreModifier(keyAbility);
	}

	//#endregion

}
