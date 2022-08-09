import type { Optional } from "../../sage-utils";
import type { PlayerCharacterCoreE20, TWeaponE20 } from "../common/PlayerCharacterE20";
import PlayerCharacterE20 from "../common/PlayerCharacterE20";

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

export type TCharacterViewType = "All" | "Combat";

export type TCharacterSectionType = "All" | "Abilities" | "AltModes" | "Armor" | "Attacks"
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
	}
	return null;
}

function orQ(value: Optional<string>): string {
	return (value ?? "").trim() || "?";
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

export default class PlayerCharacterTransformer extends PlayerCharacterE20<PlayerCharacterCoreTransformer> {
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

		//#region languages - MOVE TO SKILLS
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
					const essence = `${+(ability.essence ?? 0)} (essence)`;
					const perks = `${+(ability.perks ?? 0)} (perks)`;
					const armorOrBonus = ability.abilityName === "Strength" ? `${+(ability.armor ?? 0)} (armor)` : `${+(ability.bonus ?? 0)} (bonus)`;
					push(`[spacer]10 + ${essence} + ${perks} + ${armorOrBonus}`);
				}

				if (hasSkills) {
					const skillValues = (ability.skills ?? [])
						.filter(skill => skill.bonus || skill.die || skill.specializations?.length)
						.map(skill => this.toSkillHtml(skill));
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
		if (includes("All", "Hardpoints") && this.core.weapons?.length) {
			push();
			push(`<b>Hardpoints</b>`);
			this.core.weapons?.forEach((wpn: TWeaponTransformer) => {
				const name = wpn.name;
				const range = wpn.range ? `; Range: ${wpn.range} ` : "";
				const hands = wpn.hardpoint ? `; Hardpoint: ${wpn.hardpoint} ` : "";
				const traits = wpn.traits ? `; Traits: ${wpn.traits} ` : "";
				const attack = wpn.attack ? `; Attack: ${wpn.attack} ` : "";
				const effects = wpn.effects ? `; Effects: ${wpn.effects} ` : "";
				const altEffects = wpn.altEffects ? `; Alt Effects: ${wpn.altEffects} ` : "";
				push(`[spacer]${name}${range}${hands}${traits}${attack}${effects}${altEffects}`);
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
				const effect = armor.effect ? `; Effect: ${armor.effect} ` : "";
				const traits = armor.traits ? `; Traits: ${armor.traits} ` : "";
				push(`[spacer]${name}${desc}${effect}${traits}`);
			});
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
		if (this.core.energon) outputTypes.push("Energon");
		if (this.core.movement) outputTypes.push("Movement");
		if (this.core.health) outputTypes.push("Health");
		if (this.core.attacks?.length) outputTypes.push("Attacks");
		outputTypes.push("Abilities");
		outputTypes.push("Skills");
		if (this.core.perks) outputTypes.push("Perks");
		if (this.core.gear) outputTypes.push("Gear");
		if (this.core.backgroundBonds) outputTypes.push("BackgroundBonds");
		if (this.core.weapons?.length) outputTypes.push("Hardpoints");
		if (this.core.armor?.length) outputTypes.push("Armor");
		if (this.core.altModes?.length) outputTypes.push("AltModes");
		if (this.core.notes) outputTypes.push("Notes");
		return outputTypes as T[];
	}

	public getValidViewTypes<T extends string = TCharacterViewType>(): T[] {
		return ["All", "Combat"] as T[];
	}
}
