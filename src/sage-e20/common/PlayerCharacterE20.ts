import CharacterBase, { CharacterBaseCore } from "../../sage-utils/utils/CharacterUtils/CharacterBase";

export type TArmorE20 = {
	name?: string;
	description?: string;
	effect?: string;
	traits?: string;
};

export type TAttackE20 = {
	attack?: string;
	name?: string;
	range?: string;
	effects?: string;
	notes?: string;
};

export type TSkillE20 = {
	name: string;
	bonus?: number;
	die?: string;
	specializations?: TSkillSpecialization[];
};

type TSkillSpecialization = {
	name: string;
	checked: boolean;
};

export type TStatE20 = {
	ability?: string;
	abilityName: string;
	armor?: string;
	bonus?: string;
	defense?: string;
	defenseName: string;
	essence?: string;
	perks?: string;
	skills: TSkillE20[];
};

export type TWeaponE20 = {
	name?: string;
	range?: string;
	hands?: string;
	traits?: string;
	attack?: string;
	effects?: string;
	altEffects?: string;
};

export type TWeaponJoe = TWeaponE20 & {
	upgrades?: string;
};

export interface PlayerCharacterCoreE20 extends CharacterBaseCore<"PlayerCharacter"> {
	diceEngine: "E20";
	gameType: string;

	abilities: TStatE20[];
	armor: TArmorE20[];
	attacks: TAttackE20[];
	backgroundBonds?: string;
	name: string;
	damage?: number;
	description?: string;
	hangUps?: string;
	health?: string;
	influences?: string;
	languages?: string;
	level?: string;
	movement?: string;
	notes?: string;
	origin?: string;
	perks?: string;
	pronouns?: string;
	role?: string;
	weapons: TWeaponE20[];
}

export const Abilities: TAbilityName[] = ["Strength", "Speed", "Smarts", "Social"];
export type TAbilityName = "Strength" | "Speed" | "Smarts" | "Social";

export default abstract class PlayerCharacterE20<T extends PlayerCharacterCoreE20> extends CharacterBase<T> {

	public get abilities(): TStatE20[] { return this.core.abilities ?? []; }

	abstract getValidSectionsTypes<U extends string>(): U[];
	abstract getValidViewTypes<U extends string>(): U[];
	abstract toHtml(): string;

	protected toAbilityMathHtml(abilityName: TAbilityName): string {
		const ability = this.abilities.find(abil => abil.abilityName === abilityName);
		const essence = `${+(ability?.essence ?? 0)} (essence)`;
		const perks = `${+(ability?.perks ?? 0)} (perks)`;
		const armorOrBonus = abilityName === "Strength" ? `${+(ability?.armor ?? 0)} (armor)` : `${+(ability?.bonus ?? 0)} (bonus)`;
		return `[spacer]10 + ${essence} + ${perks} + ${armorOrBonus}`;
	}

	protected toSkillHtml(skill: TSkillE20): string {
		const name = skill.name;
		const specializations = skill.specializations?.length ? ` (${skill.specializations.map(spec => spec.name).join(", ")})` : "";
		const bonus = skill.bonus ? ` x${skill.bonus}` : "";
		const die = skill.die ? ` +${skill.die}` : "";
		return `${name}${specializations}${bonus}${die}`;
	}

	protected toSkillsHtml(abilityName: TAbilityName): string {
		const ability = this.abilities.find(abil => abil.abilityName === abilityName);
		const skillValues = (ability?.skills ?? [])
			.filter(skill => skill.bonus || skill.die || skill.specializations?.length)
			.map(skill => this.toSkillHtml(skill));
		return `[spacer]${skillValues.join(", ")}`;
	}
}
