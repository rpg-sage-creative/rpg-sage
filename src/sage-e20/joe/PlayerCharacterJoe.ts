import type { Optional } from "@rsc-utils/type-utils";
import type { PlayerCharacterCoreE20, TArmorE20, TWeaponE20 } from "../common/PlayerCharacterE20";
import PlayerCharacterE20 from "../common/PlayerCharacterE20";

export type TArmorJoe = TArmorE20 & {
	upgrades?: string;
};

export type TWeaponJoe = TWeaponE20 & {
	upgrades?: string;
};

export type TCharacterViewType = "All" | "Combat" | "Skills";

export type TCharacterSectionType = "All" | "Abilities" | "AbilityMath" | "Armor" | "Attacks"
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
		case "Skills": return ["Abilities", "AbilityMath", "Skills", "Languages"];
	}
	return null;
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
		if (includes("All", "Weapons")) {
			this.toWeaponSectionHtml().forEach(push);
		}
		//#endregion

		//#region armor
		if (includes("All", "Armor")) {
			this.toArmorSectionHtml().forEach(push);
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
		function push(value?: Optional<string>) {
			if (value || html.length > 1) {
				html.push(`${html.length ? "<br/>" : ""}${value ?? "---"}`);
			}
		}
	}

	protected toArmorHtml(armor: TArmorJoe): string {
		const name = armor.name ?? "<i>Unnamed Armor</i>";
		const desc = armor.description ? ` (${armor.description})` : "";
		const upgrades = armor.upgrades ? `; Upgrades: ${armor.upgrades} ` : "";
		const effect = armor.effect ? `; Effect: ${armor.effect} ` : "";
		const traits = armor.traits ? `; Traits: ${armor.traits} ` : "";
		return `[spacer]${name}${desc}${upgrades}${effect}${traits}`;
	}

	protected toWeaponHtml(weapon: TWeaponJoe): string {
		const base = super.toWeaponHtml(weapon);
		const upgrades = weapon.upgrades ? `; Upgrades: ${weapon.upgrades} ` : "";
		return base + upgrades;
	}

	public getValidSectionsTypes<T extends string = TCharacterSectionType>(): T[] {
		const outputTypes: TCharacterSectionType[] = super.getValidSectionsTypes();
		if (this.core.focus) {
			outputTypes.push("Focus");
		}
		if (this.core.gear) {
			outputTypes.push("Gear");
		}
		if (this.core.training) {
			outputTypes.push("Training");
		}
		return outputTypes as T[];
	}

}
