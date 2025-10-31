import { toModifier } from "../../utils/toModifier.js";
import type { HasAbilities } from "./Abilities.js";
import type { AbilityName } from "./Ability.js";

/**************************************************************************************************************************/
// Interfaces

export type CheckAbilityModifier = {
	ability: AbilityName;
	modifierCap?: number;
	modifierCapSource?: string;
	modifier: number;
};

export type CheckBonus = {
	bonus: number;
	penalty: number;
	source: string;
	type: string;
};

export class Check {
	/**************************************************************************************************************************/
	// Constructor

	public constructor(protected pc: HasAbilities, public subject: string, public dcModifier = 10) { }

	/**************************************************************************************************************************/
	// Properties

	public abilityModifier?: CheckAbilityModifier;

	public get dc(): number { return this.dcModifier + this.modifier; }

	public minimum?: number;

	public get modifier(): number {
		let abilityModifier = this.abilityModifier?.modifier ?? 0;
		const abilityModifierCap = this.abilityModifier?.modifierCap ?? abilityModifier;
		if (abilityModifierCap < abilityModifier) {
			abilityModifier = abilityModifierCap;
		}
		const modifier = abilityModifier
			+ this.modifiers.reduce((sum, bonus) => sum + bonus.bonus + bonus.penalty, 0)
			;
		if (this.minimum !== undefined && modifier < this.minimum) {
			return this.minimum;
		}
		return modifier;
	}

	public modifiers: CheckBonus[] = [];

	/**************************************************************************************************************************/
	// Instance Methods

	public setAbility(ability?: AbilityName, abilityModifierCap?: number, abilityModifierCapSource?: string): void {
		if (ability) {
			this.abilityModifier = {
				ability: ability,
				modifier: this.pc.abilities.getAbilityScoreModifier(ability),
				modifierCap: abilityModifierCap,
				modifierCapSource: abilityModifierCapSource
			};
		}
	}

	/** Returns the total modifier with the +/- included. */
	public toModifier(): string {
		return toModifier(this.modifier);
	}

	/** Used to output a value for use with stats in dice rolls. */
	public toStatString(prefix?: string): number | string {
		if (prefix) {
			switch(prefix) {
				case "dc": return this.dc;
				case "mod": return this.modifier;
				default: return `${prefix}.${this.subject}`;
			}
		}
		return this.modifier;
	}

	protected toStringAbility(outValues: string[]): void {
		if (this.abilityModifier) {
			const { ability, modifier, modifierCap } = this.abilityModifier;
			if (modifierCap === undefined || modifier < modifierCap) {
				outValues.push(`${toModifier(modifier)} (${ability.slice(0, 3)})`);
			} else {
				const { modifierCapSource } = this.abilityModifier;
				const source = modifierCapSource ? `, ${modifierCapSource}` : ``;
				outValues.push(`${toModifier(modifierCap)} (${ability.slice(0, 3)}; Capped${source})`);
			}
		}
	}

	protected toStringModifiers(outValues: string[]): void {
		this.modifiers.forEach(bonus => {
			const source = bonus.source ? `; ${bonus.source}` : ``;
			if (bonus.bonus) {
				outValues.push(`${toModifier(bonus.bonus)} (${bonus.type}${source})`);
			}
			if (bonus.penalty) {
				outValues.push(`${toModifier(bonus.penalty)} (${bonus.type}${source})`);
			}
		});
	}

	public toString(): string {
		const values: string[] = [];
		this.toStringAbility(values);
		this.toStringModifiers(values);
		if (this.minimum !== undefined && this.modifier < this.minimum) {
			values.push(`<br/>Min ${this.minimum}`);
		}
		return values.join("<br/>");
	}

}
