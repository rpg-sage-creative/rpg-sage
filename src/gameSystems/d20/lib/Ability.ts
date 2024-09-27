import type { Optional } from "@rsc-utils/core-utils";

export type AbilityName = "Strength" | "Dexterity" | "Constitution" | "Intelligence" | "Wisdom" | "Charisma";
export type AbilityKey = Lowercase<AbilityName>;

export type AbilityAbbr = "Str" | "Dex" | "Con" | "Int" | "Wis" | "Cha";
export type AbilityAbbrKey = Lowercase<AbilityAbbr>;

export class Ability {
	public constructor(public name: AbilityName) {
		this.abbr = this.name.slice(0, 3) as AbilityAbbr;
		this.abbrKey = this.abbr.toLowerCase() as AbilityAbbrKey;
		this.key = this.name.toLowerCase() as AbilityKey;
	}

	/** 3 letter abbreviation of this.name */
	public readonly abbr: AbilityAbbr;

	/** Lowercased 3 letter abbreviation of this.name; used as the key in objects/maps */
	public readonly abbrKey: AbilityAbbrKey;

	/** this.name.toLowerCase(); used as the key in objects/maps */
	public readonly key: AbilityKey;

	private static _all: Ability[];
	public static all(): Ability[] {
		return this._all ?? (this._all = this.names().map(name => new Ability(name)));
	}

	public static findByName(ability: AbilityName | AbilityAbbr | AbilityKey | AbilityAbbrKey): Ability;
	public static findByName(name: Optional<string>): Ability | undefined
	public static findByName(name: Optional<string>): Ability | undefined {
		if (!name) return undefined;
		// if we have a valid name, we also have a valid abbr; this is faster and allows for simple typos
		const abbrKey = name.slice(0, 3).toLowerCase();
		return Ability.all().find(ability => ability.abbrKey === abbrKey);
	}

	public static isValid(ability: Optional<string>): ability is AbilityName | AbilityAbbr | AbilityKey | AbilityAbbrKey {
		return Ability.findByName(ability) !== undefined;
	}

	private static _names: AbilityName[];
	public static names(): AbilityName[] {
		return this._names ?? (this._names = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]);
	}

	/** Converts an Ability Score to an Ability Score Modifier. */
	public static scoreToMod(score: Optional<number>): number {
		if (!score) return 0;
		return Math.floor((score - 10) / 2);
	}
}