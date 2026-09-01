import { isNotBlank } from "@rsc-utils/core-utils";
import { Ability, type AbilityAbbr } from "./Ability.js";

export class Skill<SkillName extends string = string> {
	public constructor(public readonly name: SkillName, abilityAbbr: AbilityAbbr, public readonly topic?: string) {
		this.ability = Ability.findByName(abilityAbbr);
		this.key = this.name.toLowerCase() as Lowercase<SkillName>;
		this.hasTopic = isNotBlank(topic);
	}

	/** The Ability associated with this Skill */
	public readonly ability: Ability;

	public readonly hasTopic: boolean;

	/** this.name.toLowerCase(); used as the key in objects/maps */
	public readonly key: Lowercase<SkillName>;
}
