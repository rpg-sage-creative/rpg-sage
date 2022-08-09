import { toMod } from "../../sage-dice";
import type { Optional } from "../../sage-utils";
import type { PlayerCharacterCoreE20, TArmorE20, TWeaponE20 } from "../common/PlayerCharacterE20";
import PlayerCharacterE20 from "../common/PlayerCharacterE20";

export type TArmorJoe = TArmorE20 & {
	upgrades?: string;
};

export type TWeaponJoe = TWeaponE20 & {
	upgrades?: string;
};

export type TCharacterViewType = "All" | "Combat";

export type TCharacterSectionType = "All" | "Abilities" | "Armor" | "Attacks"
	| "BackgroundBonds" | "Description"
	| "Focus" | "Gear"
	| "HangUps" | "Health"
	| "Influences"
	| "Languages"
	| "Movement"
	| "Notes"
	| "Origin"
	| "Perks"
	| "Skills"
	| "Training"
	| "Weapons"
	;

export function getCharacterSections(view: Optional<TCharacterViewType>): TCharacterSectionType[] | null {
	switch(view) {
		case "All": return ["All"];
		case "Combat": return ["Abilities", "Armor", "Attacks", "Health", "Movement", "Weapons"];
	}
	return null;
}

function orQ(value: Optional<string>): string {
	return (value ?? "").trim() || "?";
}

export interface PlayerCharacterCoreJoe extends PlayerCharacterCoreE20 {
	gameType: "E20 - G.I. Joe";

	armor: TArmorJoe[];
	focus?: string;
	gear?: string;
	training?: string;
	weapons: TWeaponJoe[];
}

export default class PlayerCharacterJoe extends PlayerCharacterE20<PlayerCharacterCoreJoe> {

	public toHtmlName(): string {
		const name = this.core.name ?? "Unnamed Character";
		const pronouns = this.core.pronouns ? ` (${this.core.pronouns})` : "";
		const role = this.core.role ? `${this.core.role} ` : "";
		const level = this.core.level ?? 0;
		return `${name}${pronouns} - ${role}${level}`;
	}

	public toHtml(outputTypes: TCharacterSectionType[] = ["All"]): string {
		const html: string[] = [];

		push(`<b><u>${this.toHtmlName()}</u></b>`);

		//#region origin
		if (includes("All", "Origin") && this.core.origin) {
			push("<b>Origin</b> " + this.core.origin);
		}
		//#endregion

		//#region origin
		if (includes("All", "Focus") && this.core.focus) {
			push("<b>Focus</b> " + this.core.focus);
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

		//#region health / movement
		const hasMovement = includes("All", "Movement") && this.core.movement;
		const hasHealth = includes("All", "Health") && this.core.health;
		if (hasMovement || hasHealth) {
			const parts = [];
			if (hasMovement) {
				parts.push(`<b>Movement</b> ${this.core.movement}`);
			}
			if (hasHealth) {
				const damage = this.core.damage ? `; <b>Damage</b> ${this.core.damage}` : "";
				parts.push(`<b>Health</b> ${this.core.health}${damage}`);
			}
			push(parts.join("; "));
		}
		//#endregion

		//#region attacks
		if (includes("All", "Attacks") && this.core.attacks?.length) {
			push();
			push(`<b>Attacks</b>`);
			this.core.attacks?.forEach(atk => {
				const name = atk.name;
				const range = atk.range ? `; Range: ${atk.range} ` : "";
				const attack = atk.attack ? `; Attack: ${atk.attack} ` : "";
				const effects = atk.effects ? `; Effects: ${atk.effects} ` : "";
				const notes = atk.notes ? `; Notes: ${atk.notes} ` : "";
				push(`[spacer]${name}${range}${attack}${effects}${notes}`);
			});
		}
		//#endregion

		//#region abilities
		const hasAbilities = includes("All", "Abilities") && this.core.abilities.length;
		const hasStats = hasAbilities; // includes("All", "Stats") && this.core.abilities.length;
		const hasSkills = includes("All", "Skills") && this.core.abilities?.find(ability => ability.skills?.length);
		if (hasAbilities || hasStats || hasSkills) {
			push();
			this.core.abilities?.forEach(ability => {
				push(`<b>${ability.abilityName}</b> (${orQ(ability.ability)}), <b>${ability.defenseName}</b> (${orQ(ability.defense)})`);

				if (hasStats) {
					const essence = +(ability.essence ?? 0);
					const perks = +(ability.perks ?? 0);
					const armor = +(ability.armor ?? 0);
					push(`[spacer]10 + ${essence} (essence) + ${perks} (perks) + ${armor} (armor)`);
				}

				if (hasSkills) {
					const skillValues = ability.skills?.filter(skill => skill.bonus || skill.die || skill.specializations?.length).map(skill => {
						const skillValue = `${skill.name} [${skill.bonus ? toMod(skill.bonus) : skill.die}]`;
						const specValues = skill.specializations?.map(spec => `${spec.name}!`) ?? [];
						if (specValues.length) {
							return `${skillValue} (${specValues.join(", ")})`;
						}
						return `${skillValue}`;
					}) ?? [];
					if (skillValues.length) {
						push(`[spacer]${skillValues.join(", ")}`);
					}
				}
			});
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

		//#region backgroundBonds
		if (includes("All", "Training") && this.core.training) {
			push("<b>Training and Qualifications</b> " + this.core.training);
		}
		//#endregion

		//#region weapons
		if (includes("All", "Weapons") && this.core.weapons?.length) {
			push();
			push(`<b>Weapons</b>`);
			this.core.weapons?.forEach(wpn => {
				const name = wpn.name;
				const range = wpn.range ? `; Range: ${wpn.range} ` : "";
				const hands = wpn.hands ? `; Hands: ${wpn.hands} ` : "";
				const traits = wpn.traits ? `; Traits: ${wpn.traits} ` : "";
				const attack = wpn.attack ? `; Attack: ${wpn.attack} ` : "";
				const effects = wpn.effects ? `; Effects: ${wpn.effects} ` : "";
				const altEffects = wpn.altEffects ? `; Alt Effects: ${wpn.altEffects} ` : "";
				const upgrades = wpn.upgrades ? `; Upgrades: ${wpn.upgrades} ` : ""
				push(`[spacer]${name}${range}${hands}${traits}${attack}${effects}${altEffects}${upgrades}`);
			});
		}
		//#endregion

		//#region armor
		if (includes("All", "Armor") && this.core.armor?.length) {
			push();
			push(`<b>Armor</b>`);
			this.core.armor.forEach(armor => {
				const name = armor.name;
				const desc = armor.description ? ` (${armor.description})` : "";
				const upgrades = armor.upgrades ? `; Upgrades: ${armor.upgrades} ` : ""
				const effect = armor.effect ? `; Effect: ${armor.effect} ` : "";
				const traits = armor.traits ? `; Traits: ${armor.traits} ` : "";
				push(`[spacer]${name}${desc}${upgrades}${effect}${traits}`);
			});
		}
		//#endregion

		//#region gear
		if (includes("All", "Gear") && this.core.gear) {
			push("<b>Gear</b> " + this.core.gear);
		}
		//#endregion

		//#region description
		if (includes("All", "Description") && this.core.description) {
			push("<b>Description</b> " + this.core.description);
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
		if (this.core.focus) outputTypes.push("Focus");
		if (this.core.gear) outputTypes.push("Gear");
		if (this.core.movement) outputTypes.push("Movement");
		if (this.core.health) outputTypes.push("Health");
		if (this.core.attacks?.length) outputTypes.push("Attacks");
		outputTypes.push("Abilities");
		outputTypes.push("Skills");
		if (this.core.armor?.length) outputTypes.push("Armor");
		if (this.core.training) outputTypes.push("Training");
		if (this.core.perks) outputTypes.push("Perks");
		if (this.core.backgroundBonds) outputTypes.push("BackgroundBonds");
		if (this.core.weapons?.length) outputTypes.push("Weapons");
		if (this.core.notes) outputTypes.push("Notes");
		return outputTypes as T[];
	}

	public getValidViewTypes<T extends string = TCharacterViewType>(): T[] {
		return ["All", "Combat"] as T[];
	}
}
