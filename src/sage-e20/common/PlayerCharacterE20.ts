import { CharacterBase, type CharacterBaseCore } from "@rsc-utils/character-utils";
import { errorReturnFalse, getDataRoot, type Optional } from "@rsc-utils/core-utils";
import { fileExistsSync, writeFile } from "@rsc-utils/io-utils";
import type { TSkillDie } from "../../sage-dice/dice/essence20";

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
	die?: TSkillDie;
	specializations?: TSkillSpecialization[];
};

export type TSkillSpecialization = {
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
	gameType: "E20 - G.I. Joe" | "E20 - Power Rangers" | "E20 - Transformers";

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

export function orQ(value: Optional<string>): string {
	return (value ?? "").trim() || "?";
}

export abstract class PlayerCharacterE20<T extends PlayerCharacterCoreE20> extends CharacterBase<T> {

	public get abilities(): TStatE20[] { return this.core.abilities ?? []; }

	public getValidSections<U extends string>(): U[] {
		const outputTypes: string[] = [];
		if (this.core.origin) {
			outputTypes.push("Origin");
		}
		if (this.core.description) {
			outputTypes.push("Description");
		}
		if (this.core.languages) {
			outputTypes.push("Languages");
		}
		if (this.core.influences) {
			outputTypes.push("Influences");
		}
		if (this.core.hangUps) {
			outputTypes.push("HangUps");
		}
		if (this.core.movement) {
			outputTypes.push("Movement");
		}
		if (this.core.health) {
			outputTypes.push("Health");
		}
		if (this.core.attacks?.length) {
			outputTypes.push("Attacks");
		}
		outputTypes.push("Abilities");
		outputTypes.push("AbilityMath");
		outputTypes.push("Skills");
		if (this.core.armor?.length) {
			outputTypes.push("Armor");
		}
		if (this.core.perks) {
			outputTypes.push("Perks");
		}
		if (this.core.backgroundBonds) {
			outputTypes.push("BackgroundBonds");
		}
		if (this.core.weapons?.length) {
			outputTypes.push("Weapons");
		}
		if (this.core.notes) {
			outputTypes.push("Notes");
		}
		return outputTypes as U[];
	}

	public getValidViews<U extends string>(): U[] {
		return ["Combat", "Skills"] as U[];
	}

	abstract toHtml(): string;

	protected toAbilityMathHtml(abilityName: TAbilityName): string {
		const ability = this.abilities.find(abil => abil.abilityName === abilityName);
		const essence = `${+(ability?.essence ?? 0)} (essence)`;
		const perks = `${+(ability?.perks ?? 0)} (perks)`;
		const armorOrBonus = abilityName === "Strength" ? `${+(ability?.armor ?? 0)} (armor)` : `${+(ability?.bonus ?? 0)} (bonus)`;
		return `[spacer]10 + ${essence} + ${perks} + ${armorOrBonus}`;
	}

	protected toAbilitySectionHtml({ showAbilities, showAbilityMath, showSkills }: { showAbilities:boolean; showAbilityMath:boolean; showSkills:boolean; }): Optional<string>[] {
		const html: Optional<string>[] = [];
		const doAbilities = showAbilities && this.core.abilities?.length;
		const doAbilityMath = showAbilityMath && this.core.abilities?.length;
		const doSkills = showSkills && this.core.abilities?.find(ability => ability.skills?.find(skill => skill.bonus || skill.die || skill.specializations?.length));
		if (doAbilities || doAbilityMath || doSkills) {
			html.push(undefined);
			this.core.abilities.forEach(ability => {
				html.push(`<b>${ability.abilityName}</b> (${orQ(ability.ability)}), <b>${ability.defenseName}</b> (${orQ(ability.defense)})`);
				if (doAbilityMath) {
					html.push(this.toAbilityMathHtml(ability.abilityName as TAbilityName));
				}
				if (doSkills) {
					html.push(this.toSkillsHtml(ability.abilityName as TAbilityName));
				}
			});
		}
		return html;
	}

	protected toArmorHtml(armor: TArmorE20): string {
		const name = armor.name ?? "<i>Unnamed Armor</i>";
		const desc = armor.description ? ` (${armor.description})` : "";
		const effect = armor.effect ? `; Effect: ${armor.effect} ` : "";
		const traits = armor.traits ? `; Traits: ${armor.traits} ` : "";
		return `[spacer]${name}${desc}${effect}${traits}`;
	}

	protected toArmorSectionHtml(label = "Armor"): Optional<string>[] {
		if (this.core.armor?.length) {
			return [
				undefined,
				`<b>${label}</b>`,
				...this.core.armor.map(armor => this.toArmorHtml(armor))
			];
		}
		return [];
	}

	protected toAttackHtml(atk: TAttackE20): string {
		const name = atk.name ?? "<i>Unnamed Attack</i>";
		const range = atk.range ? `; Range: ${atk.range} ` : "";
		const attack = atk.attack ? `; Attack: ${atk.attack} ` : "";
		const effects = atk.effects ? `; Effects: ${atk.effects} ` : "";
		const notes = atk.notes ? `; Notes: ${atk.notes} ` : "";
		return `[spacer]${name}${range}${attack}${effects}${notes}`;
	}

	protected toAttackSectionHtml(label = "Attacks"): Optional<string>[] {
		if (this.core.attacks?.length) {
			return [
				undefined,
				`<b>${label}</b>`,
				...this.core.attacks.map(attack => this.toAttackHtml(attack))
			];
		}
		return [];
	}

	protected toSkillHtml(skill: TSkillE20): string {
		const name = skill.name;
		const specializations = skill.specializations?.length ? ` (${skill.specializations.map(spec => spec.name).join(", ")})` : "";
		const bonus = skill.bonus ? ` x${skill.bonus}` : "";
		const die = skill.die ? ` +${skill.die}` : "";
		const specializationsNote = skill.specializations?.length ? `\\*` : "";
		return `${name}${specializations}${bonus}${die}${specializationsNote}`;
	}

	protected toSkillsHtml(abilityName: TAbilityName): string {
		const ability = this.core.abilities?.find(abil => abil.abilityName === abilityName);
		const skillValues = (ability?.skills ?? [])
			.filter(skill => skill.bonus || skill.die || skill.specializations?.length)
			.map(skill => this.toSkillHtml(skill));
		return `[spacer]${skillValues.join(", ")}`;
	}

	protected toWeaponHtml(weapon: TWeaponE20): string {
		const name = weapon.name ?? "<i>Unnamed Weapon</i>";
		const range = weapon.range ? `; Range: ${weapon.range} ` : "";
		const hands = weapon.hands ? `; Hands: ${weapon.hands} ` : "";
		const traits = weapon.traits ? `; Traits: ${weapon.traits} ` : "";
		const attack = weapon.attack ? `; Attack: ${weapon.attack} ` : "";
		const effects = weapon.effects ? `; Effects: ${weapon.effects} ` : "";
		const altEffects = weapon.altEffects ? `; Alt Effects: ${weapon.altEffects} ` : "";
		return `[spacer]${name}${range}${hands}${traits}${attack}${effects}${altEffects}`;
	}

	protected toWeaponSectionHtml(label = "Weapons"): Optional<string>[] {
		if (this.core.weapons?.length) {
			return [
				undefined,
				`<b>${label}</b>`,
				...this.core.weapons.map(weapon => this.toWeaponHtml(weapon))
			];
		}
		return [];
	}

	public static createFilePath(characterId: string): string {
		return `${getDataRoot("sage")}/e20/${characterId}.json`;
	}
	public static exists(characterId: string): boolean {
		return fileExistsSync(PlayerCharacterE20.createFilePath(characterId));
	}
	public static async saveCharacter(character: PlayerCharacterE20<any> | PlayerCharacterCoreE20): Promise<boolean> {
		const json = "toJSON" in character ? character.toJSON() : character;
		return writeFile(PlayerCharacterE20.createFilePath(character.id), json, true).catch(errorReturnFalse);
	}
	public async save(): Promise<boolean> {
		return PlayerCharacterE20.saveCharacter(this);
	}
}
