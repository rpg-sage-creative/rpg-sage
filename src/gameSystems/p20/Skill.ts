type Ability = "Strength" | "Dexterity" | "Constitution" | "Intelligence" | "Wisdom" | "Charisma";
type Abil = "Str" | "Dex" | "Con" | "Int" | "Wis" | "Cha";

export class Skill {
	public constructor(public name: string, public ability: Ability) { }

	/** this.ability.toLowerCase() */
	public get abilityKey(): Lowercase<Ability> { return this.ability.toLowerCase() as Lowercase<Ability>; }

	/** this.ability.slice(0, 3) */
	public get abil(): Abil { return this.ability.slice(0, 3) as Abil; }

	/** this.ability.slice(0, 3).toLowerCase() */
	public get abilKey(): Lowercase<Abil> { return this.ability.slice(0, 3).toLowerCase() as Lowercase<Abil>; }

	public static all(): Skill[] {
		return [
			new Skill("Acrobatics", "Dexterity"),
			new Skill("Arcana", "Intelligence"),
			new Skill("Athletics", "Strength"),
			new Skill("Computers", "Intelligence"),
			new Skill("Crafting", "Intelligence"),
			new Skill("Deception", "Charisma"),
			new Skill("Diplomacy", "Charisma"),
			new Skill("Intimidation", "Charisma"),
			new Skill("Medicine", "Wisdom"),
			new Skill("Nature", "Wisdom"),
			new Skill("Occultism", "Intelligence"),
			new Skill("Performance", "Charisma"),
			new Skill("Piloting", "Dexterity"),
			new Skill("Religion", "Wisdom"),
			new Skill("Society", "Intelligence"),
			new Skill("Stealth", "Dexterity"),
			new Skill("Survival", "Wisdom"),
			new Skill("Thievery", "Dexterity")
		];
	}

	public static findByName(name: string): Skill | undefined {
		if (!name) return undefined;
		const lower = name.toLowerCase();
		return Skill.all().find(skill => skill.name.toLowerCase() === lower);
	}

	public static forLore(topic: string): Skill {
		return new Lore(topic);
	}
}

class Lore extends Skill {
	public constructor(public topic: string) {
		super("Lore", "Intelligence");
	}
}