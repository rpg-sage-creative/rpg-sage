import type { TAbility, TBonusType, TProficiency } from "../../common";
import { CIRCUMSTANCE, ITEM, STATUS, toModifier, UNTYPED } from "../../common";
import type { IHasAbilities } from "./Abilities";
import type { IHasProficiencies } from "./PlayerCharacter";

/**************************************************************************************************************************/
// Helpers

/*
// function plus(value: number): string { return value < 0 ? "" : "+"; }
*/

/**************************************************************************************************************************/
// Interfaces

interface IAbilityModifier {
	ability: TAbility;
	modifierCap?: number;
	modifierCapSource?: string;
	modifier: number;
}
interface IBonus {
	bonus: number;
	penalty: number;
	source: string;
	type: TBonusType;
}
interface IProficiencyModifier {
	modifier: number;
	proficiency: TProficiency;
	subject: string;
}

export type TCheckPlayerCharacter = IHasAbilities & IHasProficiencies;

export class Check {
	/**************************************************************************************************************************/
	// Constructor

	public constructor(private pc: TCheckPlayerCharacter, public subject: string, public baseValue = 10) { }

	/**************************************************************************************************************************/
	// Properties

	public abilityModifier?: IAbilityModifier;
	public circumstanceBonus: IBonus = { bonus: 0, penalty: 0, source: "None", type: CIRCUMSTANCE };
	public circumstancePenalty: IBonus = { bonus: 0, penalty: 0, source: "None", type: CIRCUMSTANCE };
	public get dc(): number { return this.baseValue + this.modifier; }
	public itemBonus: IBonus = { bonus: 0, penalty: 0, source: "None", type: ITEM };
	public itemPenalty: IBonus = { bonus: 0, penalty: 0, source: "None", type: ITEM };
	public level = 0;
	public minimum?: number;
	public statusBonus: IBonus = { bonus: 0, penalty: 0, source: "None", type: STATUS };
	public statusPenalty: IBonus = { bonus: 0, penalty: 0, source: "None", type: STATUS };
	public get untypedBonuses(): IBonus[] { return this.modifiers.filter(modifier => modifier.type === UNTYPED && modifier.bonus > 0); }
	public get untypedPenalties(): IBonus[] { return this.modifiers.filter(modifier => modifier.type === UNTYPED && modifier.penalty < 0); }
	public get modifier(): number {
		let abilityModifier = this.abilityModifier && this.abilityModifier.modifier || 0;
		const abilityModifierCap = this.abilityModifier && this.abilityModifier.modifierCap;
		if (abilityModifierCap !== undefined && abilityModifierCap < abilityModifier) {
			abilityModifier = abilityModifierCap;
		}
		const modifier = this.level
			+ abilityModifier
			+ (this.proficiencyModifier?.modifier ?? 0)
			+ this.circumstanceBonus.bonus
			+ this.circumstancePenalty.penalty
			+ this.itemBonus.bonus
			+ this.itemPenalty.penalty
			+ this.statusBonus.bonus
			+ this.statusPenalty.penalty
			+ this.untypedBonuses.reduce((sum, bonus) => sum + bonus.bonus, 0)
			+ this.untypedPenalties.reduce((sum, penalty) => sum + penalty.penalty, 0)
			;
		if (this.minimum !== undefined && modifier < this.minimum) {
			return this.minimum;
		}
		return modifier;
	}
	public modifiers: IBonus[] = [];
	public proficiencies: IProficiencyModifier[] = [];
	public proficiencyModifier?: IProficiencyModifier;

	/**************************************************************************************************************************/
	// Instance Methods

	private getBonus(type: TBonusType, current: IBonus): IBonus {
		return this.modifiers
			.filter(mod => mod.type === type && mod.bonus > 0)
			.reduce((bestBonus, bonus) => !bestBonus || bonus.bonus > bestBonus.bonus ? bonus : bestBonus, current);
	}

	private getPenalty(type: TBonusType, current: IBonus): IBonus {
		return this.modifiers
			.filter(mod => mod.type === type && mod.penalty < 0)
			.reduce((worstPenalty, penalty) => !worstPenalty || penalty.penalty < worstPenalty.penalty ? penalty : worstPenalty, current);
	}

	public addModifier(source: string, modifier: number, type: TBonusType = UNTYPED): void {
		this.modifiers.push({ bonus: modifier > 0 ? modifier : 0, penalty: modifier < 0 ? modifier : 0, source: source, type: type });
	}

	public addCircumstanceModifier(source: string, modifier: number): void {
		this.addModifier(source, modifier, CIRCUMSTANCE);
		this.circumstanceBonus = this.getBonus(CIRCUMSTANCE, this.circumstanceBonus);
		this.circumstancePenalty = this.getPenalty(CIRCUMSTANCE, this.circumstancePenalty);
	}

	public addItemModifier(source: string, modifier: number): void {
		this.addModifier(source, modifier, ITEM);
		this.itemBonus = this.getBonus(ITEM, this.itemBonus);
		this.itemPenalty = this.getPenalty(ITEM, this.itemPenalty);
	}

	public addProficiency(subject: string): void {
		this.proficiencies.push({ modifier: this.pc.getProficiencyMod(subject), proficiency: this.pc.getProficiency(subject), subject: subject });
		this.proficiencyModifier = this.proficiencies.reduce((worst, prof) => !worst || prof.modifier < worst.modifier ? prof : worst, this.proficiencyModifier);
	}

	public addStatusModifier(source: string, modifier: number): void {
		this.addModifier(source, modifier, STATUS);
		this.statusBonus = this.getBonus(STATUS, this.statusBonus);
		this.statusPenalty = this.getPenalty(STATUS, this.statusPenalty);
	}

	public addUntypedModifier(source: string, modifier: number): void {
		this.addModifier(source, modifier);
	}

	// public setAbility(ability?: TAbility): void;
	// public setAbility(ability: TAbility, abilityModifierCap?: number): void;
	// public setAbility(ability: TAbility, abilityModifierCap: number, abilityModifierCapSource?: string): void;
	public setAbility(ability?: TAbility, abilityModifierCap?: number, abilityModifierCapSource?: string): void {
		if (ability) {
			this.abilityModifier = {
				ability: ability,
				modifier: this.pc.abilities.getAbilityScoreModifier(ability),
				modifierCap: abilityModifierCap,
				modifierCapSource: abilityModifierCapSource
			};
		}
	}

	public toDCString(): string {
		return `${this.baseValue}<br/>${this.toString()}`;
	}

	public toModifierString(): string {
		return this.toString();
	}

	private toStringLevel(values: string[]): void {
		if (this.level) {
			values.push(`${this.level} (Level)`);
		}
	}

	private toStringAbility(values: string[]): void {
		if (this.abilityModifier) {
			if (this.abilityModifier.modifierCap === undefined || this.abilityModifier.modifier < this.abilityModifier.modifierCap) {
				values.push(`${toModifier(this.abilityModifier.modifier)} (${this.abilityModifier.ability.slice(0, 3)})`);
			} else {
				const source = this.abilityModifier.modifierCapSource && `, ${this.abilityModifier.modifierCapSource}` || "";
				values.push(`${toModifier(this.abilityModifier.modifierCap)} (${this.abilityModifier.ability.slice(0, 3)}; Capped${source})`);
			}
		}
	}

	private toStringProficiency(values: string[]): void {
		if (this.proficiencyModifier) {
			values.push(`${toModifier(this.proficiencyModifier.modifier)} (${this.proficiencyModifier.proficiency})`);
		}
	}

	private toStringCircumstance(values: string[]): void {
		if (this.circumstanceBonus.bonus) {
			values.push(`${toModifier(this.circumstanceBonus.bonus)} (${this.circumstanceBonus.source})`);
		}
		if (this.circumstancePenalty.penalty) {
			values.push(`${toModifier(this.circumstancePenalty.penalty)} (${this.circumstancePenalty.source})`);
		}
	}

	private toStringItem(values: string[]): void {
		if (this.itemBonus.bonus) {
			values.push(`${toModifier(this.itemBonus.bonus)} (${this.itemBonus.source})`);
		}
		if (this.itemPenalty.penalty) {
			values.push(`${toModifier(this.itemPenalty.penalty)} (${this.itemPenalty.source})`);
		}
	}

	private toStringStatus(values: string[]): void {
		if (this.statusBonus.bonus) {
			values.push(`${toModifier(this.statusBonus.bonus)} (${this.statusBonus.source})`);
		}
		if (this.statusPenalty.penalty) {
			values.push(`${toModifier(this.statusPenalty.penalty)} (${this.statusPenalty.source})`);
		}
	}

	private toStringUntyped(values: string[]): void {
		this.untypedBonuses.forEach(untypedPenalty => {
			values.push(`${toModifier(untypedPenalty.bonus)} (${untypedPenalty.source})`);
		});
		this.untypedPenalties.forEach(untypedPenalty => {
			values.push(`${toModifier(untypedPenalty.penalty)} (${untypedPenalty.source})`);
		});
	}

	public toString(): string {
		const values: string[] = [];
		this.toStringLevel(values);
		this.toStringAbility(values);
		this.toStringProficiency(values);
		this.toStringCircumstance(values);
		this.toStringItem(values);
		this.toStringStatus(values);
		this.toStringUntyped(values);
		if (this.minimum !== undefined && this.modifier < this.minimum) {
			values.push(`<br/>Min ${this.minimum}`);
		}
		return values.join("<br/>");
	}
}
