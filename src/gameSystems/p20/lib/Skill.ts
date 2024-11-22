import type { Optional } from "@rsc-utils/core-utils";
import { Ability, type AbilityAbbr } from "../../d20/lib/Ability.js";

export type SkillName = "Perception"
	| "Acrobatics" | "Arcana" | "Athletics" | "Crafting" | "Deception" | "Diplomacy" | "Intimidation" | "Medicine" | "Nature" | "Occultism" | "Performance" | "Religion" | "Society" | "Stealth" | "Survival" | "Thievery"
	| "Lore"
	| "Computers" | "Piloting";

export type SkillKey = Lowercase<SkillName>;

type Options = {
	/** default behavior is to *NOT INCLUDE* Lore */
	includeLore?: boolean;
	/** default behavior is to *NOT INCLUDE* Perception */
	includePerception?: boolean;
	/** default behavior is to *INCLUDE* Starfinder skills (Computers, Piloting) */
	excludeStarfinder?: boolean;
}

export class Skill {
	public constructor(public readonly name: SkillName, abilityAbbr: AbilityAbbr) {
		this.ability = Ability.findByName(abilityAbbr);
		this.key = this.name.toLowerCase() as Lowercase<SkillName>;
	}

	/** The Ability associated with this Skill */
	public readonly ability: Ability;

	/** this.name.toLowerCase(); used as the key in objects/maps */
	public readonly key: Lowercase<SkillName>;

	public isLore(): this is Lore { return false; }

	private static _all: Skill[];
	public static all(options?: Options): Skill[] {
		if (!this._all) {
			this._all = [
				new Skill("Perception", "Wis"),
				new Skill("Acrobatics", "Dex"),
				new Skill("Arcana", "Int"),
				new Skill("Athletics", "Str"),
				new Skill("Computers", "Int"),
				new Skill("Crafting", "Int"),
				new Skill("Deception", "Cha"),
				new Skill("Diplomacy", "Cha"),
				new Skill("Intimidation", "Cha"),
				new Skill("Lore", "Int"),
				new Skill("Medicine", "Wis"),
				new Skill("Nature", "Wis"),
				new Skill("Occultism", "Int"),
				new Skill("Performance", "Cha"),
				new Skill("Piloting", "Dex"),
				new Skill("Religion", "Wis"),
				new Skill("Society", "Int"),
				new Skill("Stealth", "Dex"),
				new Skill("Survival", "Wis"),
				new Skill("Thievery", "Dex")
			];
		}
		const filterLore = options?.includeLore ? () => true : (skill: Skill) => skill.name !== "Lore";
		const filterPerception = options?.includePerception ? () => true : (skill: Skill) => skill.name !== "Perception";
		const filterStarfinder = options?.excludeStarfinder ? (skill: Skill) => skill.name !== "Computers" && skill.name !== "Piloting" : () => true;
		return this._all.filter(skill => filterLore(skill) && filterPerception(skill) && filterStarfinder(skill));
	}

	public static findByName(name: SkillName | SkillKey): Skill;
	public static findByName(name: Optional<string>): Skill | undefined;
	public static findByName(name: Optional<string>): Skill | undefined {
		if (!name) return undefined;
		const key = name.toLowerCase();
		return Skill.all({ includeLore:true, includePerception:true }).find(skill => skill.key === key);
	}

	public static forLore(topic: string): Skill {
		return new Lore(topic);
	}
}

class Lore extends Skill {
	public constructor(public topic: string) {
		super("Lore", "Int");
	}

	public isLore(): this is Lore { return true; }
}