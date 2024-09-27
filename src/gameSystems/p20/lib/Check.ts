import type { Skill } from "./Skill.js";
import { toModifier } from "../../utils/toModifier.js";
import type { TAbility, TBonusType, TProficiency } from "../../../sage-pf2e/common.js";
import { CIRCUMSTANCE, ITEM, STATUS, UNTYPED } from "../../../sage-pf2e/common.js";
import type { IHasProficiencies } from "../../../sage-pf2e/model/pc/PlayerCharacter.js";
import type { IHasAbilitiesP20 } from "./Abilities.js";

/**************************************************************************************************************************/
// Interfaces

type AbilityModifier = {
	ability: TAbility;
	modifierCap?: number;
	modifierCapSource?: string;
	modifier: number;
};

type Bonus = {
	bonus: number;
	penalty: number;
	source: string;
	type: TBonusType;
};

type ProficiencyModifier = {
	modifier: number;
	proficiency: TProficiency;
	subject: string;
};

export type TCheckPlayerCharacter = IHasAbilitiesP20 & IHasProficiencies & {
	getLevelMod(arg: boolean | number): number;
};

export class Check {
	/**************************************************************************************************************************/
	// Constructor

	public constructor(private pc: TCheckPlayerCharacter, public subject: string, public baseValue = 10) { }

	/**************************************************************************************************************************/
	// Properties

	public abilityModifier?: AbilityModifier;

	public circumstanceBonus: Bonus = { bonus: 0, penalty: 0, source: "None", type: CIRCUMSTANCE };
	public circumstancePenalty: Bonus = { bonus: 0, penalty: 0, source: "None", type: CIRCUMSTANCE };

	public get dc(): number { return this.baseValue + this.modifier; }

	public itemBonus: Bonus = { bonus: 0, penalty: 0, source: "None", type: ITEM };
	public itemPenalty: Bonus = { bonus: 0, penalty: 0, source: "None", type: ITEM };

	public level = 0;

	public minimum?: number;

	public get modifier(): number {
		let abilityModifier = this.abilityModifier?.modifier ?? 0;
		const abilityModifierCap = this.abilityModifier?.modifierCap ?? abilityModifier;
		if (abilityModifierCap < abilityModifier) {
			abilityModifier = abilityModifierCap;
		}
		const modifier = this.level
			+ (this.proficiencyModifier?.modifier ?? 0)
			+ abilityModifier
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

	public modifiers: Bonus[] = [];

	public proficiencies: ProficiencyModifier[] = [];
	public proficiencyModifier?: ProficiencyModifier;

	public statusBonus: Bonus = { bonus: 0, penalty: 0, source: "None", type: STATUS };
	public statusPenalty: Bonus = { bonus: 0, penalty: 0, source: "None", type: STATUS };

	public get untypedBonuses(): Bonus[] { return this.modifiers.filter(modifier => modifier.type === UNTYPED && modifier.bonus > 0); }
	public get untypedPenalties(): Bonus[] { return this.modifiers.filter(modifier => modifier.type === UNTYPED && modifier.penalty < 0); }

	/**************************************************************************************************************************/
	// Instance Methods

	private getBonus(type: TBonusType, current: Bonus): Bonus {
		return this.modifiers
			.filter(mod => mod.type === type && mod.bonus > 0)
			.reduce((bestBonus, bonus) => !bestBonus || bonus.bonus > bestBonus.bonus ? bonus : bestBonus, current);
	}

	private getPenalty(type: TBonusType, current: Bonus): Bonus {
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

	public addProficiency(subject: string, modifier?: number, proficiency?: TProficiency): void {
		if (!modifier) modifier = this.pc.getProficiencyMod(subject);
		if (!proficiency) proficiency = this.pc.getProficiency(subject);
		this.level = this.pc.getLevelMod(modifier);
		this.proficiencies.push({ modifier, proficiency, subject });
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

	public toExtendedString(): string {
		const mods: string[] = [this.subject];

		const abilityModifier = this.abilityModifier?.modifier ?? 0;
		const abilityModifierCap = this.abilityModifier?.modifierCap ?? abilityModifier;
		if (abilityModifierCap < abilityModifier) {
			mods.push(`${toModifier(abilityModifierCap)} ${this.abilityModifier?.ability.slice(0, 3)} (cap)`);
		}else {
			mods.push(`${toModifier(abilityModifier)} ${this.abilityModifier?.ability.slice(0, 3)}`);
		}

		mods.push(`${toModifier(this.level)} Lvl`);

		mods.push(`${toModifier(this.proficiencyModifier?.modifier ?? 0)} ${this.proficiencyModifier?.proficiency ?? "Untrained"}`);

		["circumstance", "item", "status"].forEach(type => {
			const typeKey = `${type}Bonus` as "itemBonus";
			if (this[typeKey].bonus) {
				mods.push(`${toModifier(this[typeKey].bonus)} ${this[typeKey].source}`);
			}
			if (this[typeKey].penalty) {
				mods.push(`${toModifier(this[typeKey].penalty)} ${this[typeKey].penalty}`);
			}
		});

		this.untypedBonuses.forEach(bonus => mods.push(`${toModifier(bonus.bonus)} ${bonus.source}`));
		this.untypedPenalties.forEach(bonus => mods.push(`${toModifier(bonus.penalty)} ${bonus.source}`));

		return mods.join(" ");
	}

	/** Returns the total modifier with the +/- included. */
	public toModifier(): string {
		return toModifier(this.modifier);
	}

	public toProficiencyAndModifier(): [TProficiency, number] {
		return [this.proficiencyModifier?.proficiency ?? "Untrained", this.modifier];
	}

	/** Used to output a value for use with stats in dice rolls. */
	public toStatString(prefix: string): number | string {
		if (prefix) {
			switch(prefix) {
				case "dc": return this.dc;
				case "ext": return this.toExtendedString();
				case "label": return `${this.subject} (${this.proficiencyModifier?.proficiency[0] ?? "U"})`;
				case "labeled": return `${this.toModifier()} ${this.subject} (${this.proficiencyModifier?.proficiency[0] ?? "U"})`;
				case "mod": return this.modifier;
				case "p": return `(${this.proficiencyModifier?.proficiency[0] ?? "U"})`;
				case "prof": return this.proficiencyModifier?.modifier ?? 0;
				case "proficiency": return this.proficiencyModifier?.proficiency ?? "Untrained";
				default: return `${prefix}.${this.subject}`;
			}
		}
		return this.modifier;
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

	public static forSkill(char: TCheckPlayerCharacter, skill?: Skill): Check | undefined {
		if (!skill) return undefined;

		const check = new Check(char, skill.name);
		check.addProficiency(skill.name);
		check.setAbility(skill.ability.name);
		return check;
	}

}
