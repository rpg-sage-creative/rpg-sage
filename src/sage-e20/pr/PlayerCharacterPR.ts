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

function orQ(value: Optional<string>): string {
	return (value ?? "").trim() || "?";
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
	public get zord(): TZord { return this.core.zord ?? { }; }

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

				const skillValues = (ability.skills ?? []).map(skill => {
					if (skill.bonus || skill.die) {
						const modOrDie = skill.bonus ? toMod(skill.bonus) : skill.die;
						return `${skill.name} (${modOrDie})`;
					}
					return null;
				}).filter(s => s);
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
					const essence = +(ability.essence ?? 0);
					const perks = +(ability.perks ?? 0);
					const armor = +(ability.armor ?? 0);
					const morphed = ability.morphed ?? (10 + essence + perks + armor);
					push(`[spacer]${morphed} (morphed) = 10 + ${essence} (essence) + ${perks} (perks) + ${armor} (armor)`);
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
				push(`[spacer]${name}${range}${hands}${traits}${attack}${effects}${altEffects}`);
			});
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
