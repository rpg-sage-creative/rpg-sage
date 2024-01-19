import type { Optional } from "@rsc-utils/type-utils";
import type { PlayerCharacterCoreE20, TWeaponE20 } from "../common/PlayerCharacterE20";
import { PlayerCharacterE20 } from "../common/PlayerCharacterE20";

export type TAltMode = {
	name?: string;
	crew?: string;
	health?: string;
	size?: string;
	features?: string;
	movement?: string[];
	attacks?: { name?:string; range?:string; effects?:string; }[];
	toughness?: string;
	evasion?: string;
	willpower?: string;
	cleverness?: string;
};

export type TCharacterViewType = "All" | "Combat" | "Skills";

export type TCharacterSectionType = "All" | "Abilities" | "AbilityMath" | "AltModes" | "Armor" | "Attacks"
	| "BackgroundBonds" | "Description"
	| "Energon"
	| "Gear"
	| "HangUps" | "Hardpoints" | "Health"
	| "Influences" | "Inventory"
	| "Languages"
	| "Movement"
	| "Notes"
	| "Origin"
	| "Perks" | "PersonalPower" | "Powers"
	| "Skills"
	;

export function getCharacterSections(view: Optional<TCharacterViewType>): TCharacterSectionType[] | null {
	switch(view) {
		case "All": return ["All"];
		case "Combat": return ["Abilities", "Armor", "Attacks", "Hardpoints", "Health", "Movement"];
		case "Skills": return ["Abilities", "AbilityMath", "Skills", "Languages"];
	}
	return null;
}

export type TWeaponTransformer = Omit<TWeaponE20, "hands"> & {
	hardpoint?: string;
};

export interface PlayerCharacterCoreTransformer extends PlayerCharacterCoreE20 {
	gameType: "E20 - Transformers";

	altModes?: TAltMode[];
	autobot?: boolean;
	decepticon?: boolean;
	energon?: string;
	gear?: string;
}

export class PlayerCharacterTransformer extends PlayerCharacterE20<PlayerCharacterCoreTransformer> {
	public get altModes(): TAltMode[] { return this.core.altModes ?? []; }

	public toHtmlName(): string {
		const name = this.core.name ?? "<i>Unnamed Character</i>";
		const pronouns = this.core.pronouns ? ` (${this.core.pronouns})` : "";
		const role = this.core.role ? `${this.core.role} ` : "";
		const level = this.core.level ?? 0;
		return `${name}${pronouns} - ${role}${level}`;
	}

	public toAltModeHtml(index?: Optional<number>): string[] {
		const html: string[] = [];

		const altModes = this.altModes;
		const indexedModes = index && altModes[index] ? [altModes[index]] : altModes;

		indexedModes.forEach(altMode => {
			push();

			const crew = altMode.crew ? ` - ${altMode.crew}` : "";
			push(`<b><u>${altMode.name ?? "Unnamed Alt Mode"}</u></b>${crew}`);

			if (altMode.size || altMode.health) {
				const size = altMode.size ? `<b>Size</b> ${altMode.size}` : "";
				const health = altMode.health ? `<b>Health</b> ${altMode.health}` : "";
				push([size, health].filter(s => s).join("; "));
			}

			if (altMode.movement?.length) {
				push(`<b>Movement</b> ${altMode.movement.join("; ")}`);
			}

			if (altMode.features) {
				push(`<b>Features</b> ${altMode.features}`);
			}

			//#region attacks
			if (altMode.attacks?.length) {
				push(`<b>Attacks</b>`);
				altMode.attacks?.forEach(atk => {
					const name = atk.name ?? "<i>Unnamed Attack</i>";
					const range = atk.range ?? "";
					const effects = atk.effects ? ` (${atk.effects})` : "";
					push(`[spacer]<b>${name}:</b> ${range}${effects}`);
				});
			}
			//#endregion

			const stats: string[] = [];
			if (altMode.toughness) {
				stats.push(`Toughness (${altMode.toughness})`);
			}
			if (altMode.evasion) {
				stats.push(`Evasion (${altMode.evasion})`);
			}
			if (altMode.willpower) {
				stats.push(`Willpower (${altMode.willpower})`);
			}
			if (altMode.cleverness) {
				stats.push(`Cleverness (${altMode.cleverness})`);
			}
			push(stats.join("; "));

		});

		return html;

		function push(value?: string) {
			html.push(value ?? "---");
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
		const hasEnergon = includes("All", "Energon") && this.core.energon;
		const hasMovement = includes("All", "Movement") && this.core.movement;
		if (hasEnergon || hasMovement) {
			const parts = [];
			if (hasEnergon) {
				parts.push(`<b>Energon</b> ${this.core.energon}`);
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

		//#region perks
		if (includes("All", "Perks") && this.core.perks) {
			push("<b>Perks</b> " + this.core.perks);
		}
		//#endregion

		//#region gear
		if (includes("All", "Gear") && this.core.gear) {
			push("<b>Powers</b> " + this.core.gear);
		}
		//#endregion

		//#region backgroundBonds
		if (includes("All", "BackgroundBonds") && this.core.backgroundBonds) {
			push("<b>Background Bonds</b> " + this.core.backgroundBonds);
		}
		//#endregion

		//#region weapons
		if (includes("All", "Hardpoints")) {
			this.toWeaponSectionHtml("Hardpoints").forEach(push);
		}
		//#endregion

		//#region armor
		if (includes("All", "Armor")) {
			this.toArmorSectionHtml().forEach(push);
		}
		//#endregion

		//#region inventory
		if (includes("All", "AltModes") && this.core.altModes?.length) {
			push();
			this.toAltModeHtml().forEach(push);
		}
		//#endregion

		//#region notes
		if (includes("All", "Notes") && this.core.notes) {
			push("<b>Origin Notes</b> " + this.core.notes);
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

	protected toWeaponHtml(weapon: TWeaponTransformer): string {
		const name = weapon.name ?? "<i>Unnamed Weapon</i>";
		const range = weapon.range ? `; Range: ${weapon.range} ` : "";
		const hardpoint = weapon.hardpoint ? `; Hardpoint: ${weapon.hardpoint} ` : "";
		const traits = weapon.traits ? `; Traits: ${weapon.traits} ` : "";
		const attack = weapon.attack ? `; Attack: ${weapon.attack} ` : "";
		const effects = weapon.effects ? `; Effects: ${weapon.effects} ` : "";
		const altEffects = weapon.altEffects ? `; Alt Effects: ${weapon.altEffects} ` : "";
		return `[spacer]${name}${range}${hardpoint}${traits}${attack}${effects}${altEffects}`;
	}

	public getValidSectionsTypes<T extends string = TCharacterSectionType>(): T[] {
		const outputTypes: TCharacterSectionType[] = super.getValidSectionsTypes();
		if (this.core.energon) {
			outputTypes.push("Energon");
		}
		if (this.core.gear) {
			outputTypes.push("Gear");
		}
		if (this.core.weapons?.length) {
			outputTypes.push("Hardpoints");
		}
		if (this.core.altModes?.length) {
			outputTypes.push("AltModes");
		}
		return outputTypes as T[];
	}

}
