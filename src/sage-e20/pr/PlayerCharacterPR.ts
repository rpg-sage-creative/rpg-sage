import { type Optional, isDefined, numberOrUndefined, stringOrUndefined } from "@rsc-utils/core-utils";
import type { StatResults } from "@rsc-utils/dice-utils";
import type { TSkillDie } from "../../sage-dice/dice/e20/index.js";
import { type PlayerCharacterCoreE20, PlayerCharacterE20, type TAbilityName, type TStatE20, orQ } from "../common/PlayerCharacterE20.js";

export type TStatPR = TStatE20 & {
	morphed?: string;
};

export type TAttackZord = {
	name?: string;
	range?: string;
	effects?: string;
};

export type TStatZord = {
	ability?: string;
	abilityName: string;
	defense?: string;
	defenseName?: string;
	skills?: TSkillZord[];
};

export type TSkillZord = {
	name?: string;
	bonus?: number;
	die?: TSkillDie;
};

export type TZord = {
	abilities?: TStatZord[];
	attacks?: TAttackZord[];
	damage?: number;
	features?: string;
	health?: string;
	movement?: string;
	name?: string;
	size?: string;
	skillNotes?: string;
};

export type TCharacterViewType = "All" | "Combat" | "Skills";

export type TCharacterSectionType = "All" | "Abilities" | "AbilityMath" | "Armor" | "Attacks"
	| "BackgroundBonds" | "Description"
	| "HangUps" | "Health"
	| "Influences" | "Inventory"
	| "Languages"
	| "Movement"
	| "Notes"
	| "Origin"
	| "Perks" | "PersonalPower" | "Powers"
	| "Skills"
	| "Weapons"
	| "Zord"
	;

export function getCharacterSections(view: Optional<TCharacterViewType>): TCharacterSectionType[] | null {
	switch(view) {
		case "All": return ["All"];
		case "Combat": return ["Abilities", "Armor", "Attacks", "Health", "Movement", "Weapons"];
		case "Skills": return ["Abilities", "AbilityMath", "Skills", "Languages"];
	}
	return null;
}

export interface PlayerCharacterCorePR extends PlayerCharacterCoreE20 {
	gameType: "E20 - Power Rangers";

	abilities: TStatPR[];
	inventory?: string;
	personalPower?: string;
	powers?: string;
	zord: TZord;
}

export class PlayerCharacterPR extends PlayerCharacterE20<PlayerCharacterCorePR> {
	public getStat(key: string, keyLower = key.toLowerCase() as Lowercase<string>): StatResults<string | number, undefined> {
		const { zords } = this;
		if (!zords.length || !keyLower.startsWith("zord.")) {
			return super.getStat(key, keyLower);
		}

		let zordKeyLower: Lowercase<string>;
		const parts = keyLower.split(".");
		const nameOrIndex = numberOrUndefined(parts[1]) ?? stringOrUndefined(parts[1]?.replace(/\W+/g, ""))?.toLowerCase();

		/** @todo prepare zord names for comparison to key */
		const compareName = (name: Optional<string>) => name && nameOrIndex ? nameOrIndex === name : false;

		let zord = zords.find((zord, index) => index === nameOrIndex || compareName(zord.name));
		if (zord) {
			// if we found an zord by name or id, the stat key is now the parts after `zord.BLAH.`
			zordKeyLower = parts.slice(2).join(".") as Lowercase<string>;
		}else {
			// let's default to the first zord
			zord = zords[0];
			// the stat key is now the parts after `zord.`
			zordKeyLower = parts.slice(1).join(".") as Lowercase<string>;
		}

		// return value creator
		const ret = (casedKey = key, value: Optional<number | string> = undefined) => (
			{ isDefined:isDefined(value), key:casedKey, keyLower, value:value??undefined } as StatResults<string | number, undefined>
		);

		// no zord, kick out undefined
		if (!zord) return ret();

		const zordNameOrIndex = nameOrIndex !== undefined ? typeof(nameOrIndex) === "number" ? nameOrIndex : zord.name?.replace(/\W+/g, "").toLowerCase() : undefined;
		const casedKeyBase = zordNameOrIndex === undefined ? `zord` : `zord.${zordNameOrIndex}`;

		/** @todo i may need to use keyLower.replace(/\W+, "") */
		const testKey = (casedKeySuffix: string, value: Optional<string | number>) => {
			return zordKeyLower === casedKeySuffix.toLowerCase()
				? ret(`${casedKeyBase}.${casedKeySuffix}`, value)
				: undefined;
		}

		let results: StatResults<string | number, undefined> | undefined;

		const coreKeys: (keyof TZord & ("health" | "damage"))[] = ["health", "damage"];
		for (const coreKey of coreKeys) {
			results = testKey(coreKey, zord[coreKey]);
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

		const properties: Exclude<keyof TStatZord, "skills">[] = ["ability", "abilityName", "defense", "defenseName"];
		const { abilities = [] } = zord;
		for (const abil of abilities) {
			results = testKey(abil.abilityName, abil.ability);
			if (results) return results;

			results = testKey(`${abil.abilityName}.name`, abil.abilityName);
			if (results) return results;

			results = testKey(abil.defenseName!, abil.defense);
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

	public get zord(): TZord { return this.core.zord ?? { }; }
	public get zords(): TZord[] { return this.core.zord ? [this.core.zord] : []; }

	public toHtmlName(): string {
		const name = this.core.name ?? "Unnamed Character";
		const pronouns = this.core.pronouns ? ` (${this.core.pronouns})` : "";
		const role = this.core.role ? `${this.core.role} ` : "";
		const level = this.core.level ?? 0;
		return `${name}${pronouns} - ${role}${level}`;
	}

	public toZordHtml(): string[] {
		const html: string[] = [];

		const zord = this.core.zord;

		push(`<b><u>${zord.name ?? "Unnamed Zord"}</u></b>`);

		//#region abilities / skills
		if (zord.abilities?.length) {
			zord.abilities?.forEach(ability => {
				if (ability.abilityName !== "Other") {
					push(`<b>${ability.abilityName}</b> (${orQ(ability.ability)}), <b>${ability.defenseName}</b> (${orQ(ability.defense)})`);
				}else if (ability.skills?.find(skill => skill.name && skill.die)) {
					push(`<b>Other</b>`);
				}

				const skillValues = (ability.skills ?? [])
					.filter(skill => skill.bonus || skill.die)
					.map(skill => this.toSkillHtml(skill as any));
				if (skillValues.length) {
					push(`[spacer]${skillValues.join(", ")}`);
				}
			});
		}
		if (zord.skillNotes) {
			push(`<b>Skill Notes</b> ${zord.skillNotes}`);
		}
		//#endregion

		//#region attacks
		if (zord.attacks?.length) {
			push(`<b>Attacks</b>`);
			zord.attacks?.forEach(atk => {
				const name = atk.name;
				const range = atk.range ? `; Range: ${atk.range} ` : "";
				const effects = atk.effects ? `; Effects: ${atk.effects} ` : "";
				push(`[spacer]${name}${range}${effects}`);
			});
		}
		//#endregion

		if (zord.size || zord.movement) {
			const size = zord.size ? `<b>Size</b> ${zord.size}` : "";
			const movement = zord.movement ? `<b>Movement</b> ${zord.movement}` : "";
			push([size, movement].filter(s => s).join("; "));
		}

		//#region health
		if (zord.health) {
			const damage = zord.damage ? `; <b>Damage</b> ${zord.damage}` : "";
			push(`<b>Health</b> ${zord.health}${damage}`);
		}
		//#endregion

		if (zord.features) {
			push(`<b>Features</b> ${zord.features}`);
		}

		return html;

		function push(value?: string) {
			html.push(value ?? "---");
		}
	}

	protected toAbilityMathHtml(abilityName: TAbilityName): string {
		const ability = this.abilities.find(abil => abil.abilityName === abilityName) as TStatPR;
		const essence = +(ability?.essence ?? 0);
		const perks = +(ability?.perks ?? 0);
		const [armorOrBonus, armorOrBonusLabel] = abilityName === "Strength" ? [+(ability?.armor ?? 0), "armor"] : [+(ability?.bonus ?? 0), "bonus"];
		const morphed = ability?.morphed ?? (10 + essence + perks + armorOrBonus);
		return `[spacer]${morphed} (morphed) = 10 + ${essence} (essence) + ${perks} (perks) + ${armorOrBonus} (${armorOrBonusLabel})`;
	}

	public toHtml(outputTypes: TCharacterSectionType[] = ["All"]): string {
		const html: string[] = [];

		push(`<b><u>${this.toHtmlName()}</u></b>`);

		//#region origin
		if (includes("All", "Origin") && this.core.origin) {
			push("<b>Origin</b> " + this.core.origin);
		}
		//#endregion

		//#region description
		if (includes("All", "Description") && this.core.description) {
			push("<b>Description</b> " + this.core.description);
		}
		//#endregion

		//#region influences
		if (includes("All", "Influences") && this.core.influences) {
			push("<b>Influences</b> " + this.core.influences);
		}
		//#endregion

		//#region hangUps
		if (includes("All", "HangUps") && this.core.hangUps) {
			push("<b>Hang-Ups</b> " + this.core.hangUps);
		}
		//#endregion

		//#region personalPower / movement
		const hasPersonalPower = includes("All", "PersonalPower") && this.core.personalPower;
		const hasMovement = includes("All", "Movement") && this.core.movement;
		if (hasPersonalPower || hasMovement) {
			const parts = [];
			if (hasPersonalPower) {
				parts.push(`<b>Personal Power</b> ${this.core.personalPower}`);
			}
			if (hasMovement) {
				parts.push(`<b>Movement</b> ${this.core.movement}`);
			}
			push(parts.join("; "));
		}
		//#endregion

		//#region health
		if (includes("All", "Health") && this.core.health) {
			const damage = this.core.damage ? `; <b>Damage</b> ${this.core.damage}` : "";
			push(`<b>Health</b> ${this.core.health}${damage}`);
		}
		//#endregion

		//#region attacks
		if (includes("All", "Attacks")) {
			this.toAttackSectionHtml().forEach(push);
		}
		//#endregion

		//#region abilities
		const showAbilities = includes("All", "Abilities");
		const showAbilityMath = includes("All", "AbilityMath");
		const showSkills = includes("All", "Skills");
		this.toAbilitySectionHtml({ showAbilities, showAbilityMath, showSkills }).forEach(push);
		//#endregion

		//#region languages
		if (includes("All", "Languages") && this.core.languages) {
			push("<b>Languages</b> " + this.core.languages);
		}
		//#endregion

		//#region armor
		if (includes("All", "Armor")) {
			this.toArmorSectionHtml().forEach(push);
		}
		//#endregion

		//#region powers
		if (includes("All", "Powers") && this.core.powers) {
			push("<b>Powers</b> " + this.core.powers);
		}
		//#endregion

		//#region perks
		if (includes("All", "Perks") && this.core.perks) {
			push("<b>Perks</b> " + this.core.perks);
		}
		//#endregion

		//#region backgroundBonds
		if (includes("All", "BackgroundBonds") && this.core.backgroundBonds) {
			push("<b>Background Bonds</b> " + this.core.backgroundBonds);
		}
		//#endregion

		//#region weapons
		if (includes("All", "Weapons")) {
			this.toWeaponSectionHtml().forEach(push);
		}
		//#endregion

		//#region inventory
		if (includes("All", "Inventory") && this.core.inventory) {
			push("<b>Inventory</b> " + this.core.inventory);
		}
		//#endregion

		//#region notes
		if (includes("All", "Notes") && this.core.notes) {
			push("<b>Notes</b> " + this.core.notes);
		}
		//#endregion

		//#region Zord
		if (includes("All", "Zord") && this.core.zord) {
			push();
			this.toZordHtml().forEach(push);
		}
		//#endregion

		return html.join("");

		function includes(...types: TCharacterSectionType[]): boolean {
			return types.find(type => outputTypes.includes(type)) !== undefined;
		}
		function push(value?: Optional<string>) {
			if (value || html.length > 1) {
				html.push(`${html.length ? "<br/>" : ""}${value ?? "---"}`);
			}
		}
	}

	public getValidSections<T extends string = TCharacterSectionType>(): T[] {
		const outputTypes: TCharacterSectionType[] = super.getValidSections();
		if (this.core.inventory) {
			outputTypes.push("Inventory");
		}
		if (this.core.personalPower) {
			outputTypes.push("PersonalPower");
		}
		if (this.core.powers) {
			outputTypes.push("Powers");
		}
		if (this.core.zord) {
			outputTypes.push("Zord");
		}
		return outputTypes as T[];
	}

}
