import { CharacterBase, type CharacterBaseCore } from "@rsc-utils/game-utils";
import { errorReturnFalse, getDataRoot, isDefined, numberOrUndefined, stringOrUndefined, type Optional } from "@rsc-utils/core-utils";
import type { StatResults } from "@rsc-utils/dice-utils";
import { fileExistsSync, writeFile } from "@rsc-utils/io-utils";
import type { TSkillDie } from "../../sage-dice/dice/e20/index.js";

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

export const Abilities = ["Strength", "Speed", "Smarts", "Social"] as const;
export type TAbilityName = typeof Abilities[number];

export function orQ(value: Optional<string>): string {
	return (value ?? "").trim() || "?";
}

export abstract class PlayerCharacterE20<T extends PlayerCharacterCoreE20> extends CharacterBase<T> {
	public gameSystem: "E20" = "E20";
	public importedFrom: "PDF" = "PDF";

	/** returns the value for the given key */
	public getNumber(key: string): number | undefined {
		return numberOrUndefined(this.getStat(key).value);
	}

	/** returns the value for the given key */
	public getString(key: string): string | undefined {
		const stat = this.getStat(key);
		return isDefined(stat.value) ? stringOrUndefined(String(stat.value)) : undefined;
	}

	public getStat(key: string, keyLower = key.toLowerCase() as Lowercase<string>): StatResults<string | number, undefined> {
		// return value creator
		const ret = (casedKey = key, value: Optional<number | string> = undefined) => (
			{ isDefined:isDefined(value), key:casedKey, keyLower, value:value??undefined } as StatResults<string | number, undefined>
		);

		// tests given key and returns ret value if a match
		const testKey = (casedKey: string, value: Optional<string | number>) => keyLower === casedKey.toLowerCase() ? ret(casedKey, value) : undefined;

		// reusable results var
		let results: StatResults<string | number, undefined> | undefined;

		const coreKeys = ["level", "health", "damage"];
		for (const coreKey of coreKeys) {
			results = testKey(coreKey, this.core[coreKey as "level"]);
			if (results) return results;
		}

		/*
		AorD >> Ability or Defense
		AorD             >> abilities[index].ability/defense
		AorD.ability     >> abilities[index].ability
		AorD.abilityName >> abilities[index].abilityName
		AorD.name        >> abilities[index].abilityName/defenseName
		AorD.armor       >> abilities[index].armor
		AorD.bonus       >> abilities[index].bonus
		AorD.defense     >> abilities[index].defense
		AorD.defenseName >> abilities[index].defenseName
		AorD.essence     >> abilities[index].essence
		Skill.die        >>
		Skill.bonus      >>
		Spec ?
		*/


		const properties: Exclude<keyof TStatE20, "skills">[] = ["ability", "abilityName", "armor", "bonus", "defense", "defenseName", "essence"];
		for (const abil of this.abilities) {
			results = testKey(abil.abilityName, abil.ability);
			if (results) return results;

			results = testKey(`${abil.abilityName}.name`, abil.abilityName);
			if (results) return results;

			results = testKey(abil.defenseName, abil.defense);
			if (results) return results;

			results = testKey(`${abil.defenseName}.name`, abil.defenseName);
			if (results) return results;

			for (const prop of properties) {
				results = testKey(`${abil.abilityName}.${prop}`, abil[prop]);
				if (results) return results;

				results = testKey(`${abil.defenseName}.${prop}`, abil[prop]);
				if (results) return results;
			}

			const { skills = [] } = abil;
			for (const skill of skills) {
				// if (regexp.test(skill.name)) {
				// 	return 1; // presence of a skill ... should that be a 1 or true or ...?
				// }

				results = testKey(`${skill.name}.die`, skill.die);
				if (results) return results;

				results = testKey(`${skill.name}.bonus`, skill.bonus);
				if (results) return results;

				// const { specializations = [] } = skill;
				// for (const spec of specializations) {
				// 	if (regexp.test(spec.name)) {
				// 		return 1; // presence of a specialization ... should that be a 1 or true or ...?
				// 	}
				// }
			}
		}

		return ret();
	}

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
		return writeFile(PlayerCharacterE20.createFilePath(character.id), json, { makeDir:true }).catch(errorReturnFalse);
	}
	public async save(): Promise<boolean> {
		return PlayerCharacterE20.saveCharacter(this);
	}
}
