import { toMod } from "../../sage-dice";
import type { Optional } from "../../sage-utils";
import type { PlayerCharacterCoreE20, TStatE20 } from "../common/PlayerCharacterE20";
import PlayerCharacterE20 from "../common/PlayerCharacterE20";

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
}

export type TSkillZord = {
	name?: string;
	bonus?: number;
	die?: string;
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

export type TCharacterViewType = "All" | "Combat";

export type TCharacterSectionType = "All" | "Abilities" | "Armor" | "Attacks"
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

export default class PlayerCharacterPR extends PlayerCharacterE20<PlayerCharacterCorePR> {
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

		push(`<b><u>${zord.name}</u></b>`);

		//#region abilities / skills
		if (zord.abilities?.length) {
			push(`<b>Abilities</b>`);
			zord.abilities?.forEach(ability => {
				const baseValues = `<b>${ability.abilityName}</b> (${ability.ability}), <b>${ability.defenseName}</b> (${ability.defense})`;
				push(baseValues);

				const skillValues = (ability.skills ?? []).map(skill =>
					skill.bonus || skill.die ? `${skill.name} (${skill.bonus ? toMod(skill.bonus) : skill.die})` : null
				).filter(s => s);
				if (skillValues.length) {
					push(`${ability.abilityName}: ${skillValues.join(", ")}`);
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
				push(`${name}${range}${effects}`);
			});
		}
		//#endregion

		if (zord.size || zord.movement) {
			const size = zord.size ? `<b>Size</b> ${zord.size}` : "";
			const movement = zord.movement ? `<b>Movement</b> ${zord.movement}` : "";
			push([size, movement].join("; "));
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
			if (value || html.length > 1) {
				html.push(`${html.length ? "<br/>" : ""}${value ?? "---"}`);
			}
		}
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

		//#region languages
		if (includes("All", "Languages") && this.core.languages) {
			push("<b>Languages</b> " + this.core.languages);
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
				parts.push(`<b>PMovement</b> ${this.core.movement}`);
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
		if (includes("All", "Attacks") && this.core.attacks?.length) {
			push(`<b>Attacks</b>`);
			this.core.attacks?.forEach(atk => {
				const name = atk.name;
				const range = atk.range ? `; Range: ${atk.range} ` : "";
				const attack = atk.attack ? `; Attack: ${atk.attack} ` : "";
				const effects = atk.effects ? `; Effects: ${atk.effects} ` : "";
				const notes = atk.notes ? `; Notes: ${atk.notes} ` : "";
				return `${name}${range}${attack}${effects}${notes}`;
			});
		}
		//#endregion

		//#region abilities
		if (includes("All", "Abilities") && this.core.abilities.length) {
			push(`<b>Abilities</b>`);
			this.core.abilities?.forEach(ability => {
				const baseValues = `<b>${ability.abilityName}</b> (${ability.ability}), <b>${ability.defenseName}</b> (${ability.defense})`;
				const essence = +(ability.essence ?? 0);
				const perks = +(ability.perks ?? 0);
				const armor = +(ability.armor ?? 0);
				const morphed = ability.morphed ?? (10 + essence + perks + armor);
				const mathValues = `${morphed} (morphed) = 10 + ${essence} (essence) + ${perks} (perks) + ${armor} (armor)`;

				push(baseValues);
				push(mathValues);
			});
		}
		//#endregion

		//#region skills
		if (includes("All", "Skills") && this.core.abilities?.find(ability => ability.skills?.length)) {
			push(`<b>Skills</b>`);
			this.core.abilities.forEach(ability => {
				const skillValues = ability.skills?.map(skill => {
					const skillValue = `${skill.name} (${skill.bonus ? toMod(skill.bonus) : skill.die})`;
					const specValues = skill.specializations?.map(spec => `${spec.name}${spec.checked?" ✅":""}`) ?? [];
					if (specValues.length) {
						return `${skillValue} (${specValues.join(", ")})`;
					}
					return `${skillValue}`;
				}) ?? [];
				if (skillValues.length) {
					push(`${ability.abilityName}: ${skillValues.join(", ")}`);
				}
			});
		}
		//#endregion

		//#region armor
		if (includes("All", "Armor") && this.core.armor?.length) {
			this.core.armor.forEach(armor => {
				const name = armor.name;
				const desc = armor.description ? ` (${armor.description})` : "";
				const effect = armor.effect ? `; Effect: ${armor.effect} ` : "";
				const traits = armor.traits ? `; Traits: ${armor.traits} ` : "";
				return `${name}${desc}${effect}${traits}`;
			});
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
		if (includes("All", "Weapons") && this.core.weapons?.length) {
			push(`<b>Weapons</b>`);
			this.core.weapons?.forEach(wpn => {
				const name = wpn.name;
				const range = wpn.range ? `; Range: ${wpn.range} ` : "";
				const hands = wpn.hands ? `; Hands: ${wpn.hands} ` : "";
				const traits = wpn.traits ? `; Traits: ${wpn.traits} ` : "";
				const attack = wpn.attack ? `; Attack: ${wpn.attack} ` : "";
				const effects = wpn.effects ? `; Effects: ${wpn.effects} ` : "";
				const altEffects = wpn.altEffects ? `; Alt Effects: ${wpn.altEffects} ` : "";
				return `${name}${range}${hands}${traits}${attack}${effects}${altEffects}`;
			});
		}
		//#endregion

		//#region Zord
		if (includes("All", "Zord") && this.core.zord) {
			push();
			this.toZordHtml().forEach(push);
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

		return html.join("");

		function includes(...types: TCharacterSectionType[]): boolean {
			return types.find(type => outputTypes.includes(type)) !== undefined;
		}
		function push(value?: string) {
			if (value || html.length > 1) {
				html.push(`${html.length ? "<br/>" : ""}${value ?? "---"}`);
			}
		}
	}

	public getValidSectionsTypes<T extends string = TCharacterSectionType>(): T[] {
		const outputTypes: TCharacterSectionType[] = [];
		if (this.core.origin) outputTypes.push("Origin");
		if (this.core.description) outputTypes.push("Description");
		if (this.core.languages) outputTypes.push("Languages");
		if (this.core.influences) outputTypes.push("Influences");
		if (this.core.hangUps) outputTypes.push("HangUps");
		if (this.core.personalPower) outputTypes.push("PersonalPower");
		if (this.core.movement) outputTypes.push("Movement");
		if (this.core.health) outputTypes.push("Health");
		if (this.core.attacks?.length) outputTypes.push("Attacks");
		outputTypes.push("Abilities");
		outputTypes.push("Skills");
		if (this.core.armor?.length) outputTypes.push("Armor");
		if (this.core.powers) outputTypes.push("Powers");
		if (this.core.perks) outputTypes.push("Perks");
		if (this.core.backgroundBonds) outputTypes.push("BackgroundBonds");
		if (this.core.weapons?.length) outputTypes.push("Weapons");
		if (this.core.zord) outputTypes.push("Zord");
		if (this.core.inventory) outputTypes.push("Inventory");
		if (this.core.notes) outputTypes.push("Notes");
		return outputTypes as T[];
	}
	public getValidViewTypes<T extends string = TCharacterViewType>(): T[] {
		return ["All", "Combat"] as T[];
	}
}
