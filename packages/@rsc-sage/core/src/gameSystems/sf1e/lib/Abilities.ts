import type { Optional } from "@rsc-utils/core-utils";
import { Abilities as AbilitiesD20 } from "../../d20/lib/Abilities.js";
import { Ability, type AbilityNameResolvable } from "../../d20/lib/Ability.js";
import { Check } from "../../d20/lib/Check.js";

export interface IHasAbilities { abilities: Abilities; }

export abstract class Abilities extends AbilitiesD20 {

	//#region Properties

	// public get keyAbility(): AbilityName | undefined { return this.getKeyAbility(); }

	//#endregion

	//#region Instance Methods

	/** Create a Check for the given ability. */
	public getCheck(ability: AbilityNameResolvable): Check;
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
	// public abstract getKeyAbility(className?: string): AbilityName | undefined;

	/** Get the Ability Score Modifier for the given Class. */
	// public getKeyAbilityScoreModifier(className?: string): number {
	// 	const keyAbility = this.getKeyAbility(className);
	// 	if (!keyAbility) return 0;
	// 	return this.getAbilityScoreModifier(keyAbility);
	// }

	//#endregion

}
