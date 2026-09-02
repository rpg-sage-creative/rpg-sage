import type { Optional } from "@rsc-utils/core-utils";
import type { AbilityAbbr } from "../../d20/lib/Ability.js";
import { Skill as SkillD20 } from "../../d20/lib/Skill.js";

export type SkillName = "Perception"
	| "Acrobatics" | "Athletics" | "Bluff" | "Computers" | "Culture" | "Diplomacy" | "Disguise" | "Engineering" | "Intimidate" | "Life Science" | "Medicine" | "Mysticism" | "Physical Science" | "Piloting" | "Sense Motive" | "Sleight of Hand" | "Stealth" | "Survival"
	| "Profession";

export type SkillKey = Lowercase<SkillName>;

type Options = {
	/** default behavior is to *NOT INCLUDE* Lore */
	includeProfession?: boolean;
	/** default behavior is to *NOT INCLUDE* Perception */
	includePerception?: boolean;
};

export class Skill extends SkillD20<SkillName> {
	public constructor(name: SkillName, abilityAbbr: AbilityAbbr, topic?: string) {
		super(name, abilityAbbr, topic);
	}

	public isProfession(): this is Skill & { name:"Profession"; topic:string; } { return this.name === "Profession" && this.hasTopic; }

	private static _all = [
		new Skill("Perception", "Wis"),
		new Skill("Acrobatics", "Dex"),
		new Skill("Athletics", "Str"),
		new Skill("Bluff", "Cha"),
		new Skill("Computers", "Int"),
		new Skill("Culture", "Int"),
		new Skill("Diplomacy", "Cha"),
		new Skill("Disguise", "Cha"),
		new Skill("Engineering", "Int"),
		new Skill("Intimidate", "Cha"),
		new Skill("Life Science", "Int"),
		new Skill("Medicine", "Int"),
		new Skill("Mysticism", "Wis"),
		new Skill("Physical Science", "Int"),
		new Skill("Piloting", "Dex"),
		new Skill("Profession", "Int"),
		new Skill("Sense Motive", "Wis"),
		new Skill("Sleight of Hand", "Dex"),
		new Skill("Stealth", "Dex"),
		new Skill("Survival", "Wis"),
	];

	public static all(options?: Options): Skill[] {
		const filterPerception = options?.includePerception ? () => true : (skill: Skill) => skill.name !== "Perception";
		const filterProfession = options?.includeProfession ? () => true : (skill: Skill) => skill.name !== "Profession";
		return this._all.filter(skill => filterPerception(skill) && filterProfession(skill));
	}

	public static findByName(name: SkillName | SkillKey): Skill;
	public static findByName(name: Optional<string>): Skill | undefined;
	public static findByName(name: Optional<string>): Skill | undefined {
		if (!name) return undefined;
		const key = name.toLowerCase();
		return Skill.all({ includePerception:true, includeProfession:true }).find(skill => skill.key === key);
	}

	public static forProfession(topic: string, abilityAbbr: AbilityAbbr = "Int"): Skill {
		return new Skill("Profession", abilityAbbr, topic);
	}
}
