import type { Optional } from "@rsc-utils/core-utils";

export const AbilityNames = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"] as const;

export type AbilityName = typeof AbilityNames[number];
export type AbilityKey = Lowercase<AbilityName>;

export type AbilityAbbr = "Str" | "Dex" | "Con" | "Int" | "Wis" | "Cha";
export type AbilityAbbrKey = Lowercase<AbilityAbbr>;

export type AbilityNameResolvable = AbilityName | AbilityKey | AbilityAbbr | AbilityAbbrKey;

export class Ability {
	private constructor(public name: AbilityName) {
		this.abbr = this.name.slice(0, 3) as AbilityAbbr;
		this.abbrKey = this.abbr.toLowerCase();
		this.isMental = this.abbr === "Int" || this.abbr === "Wis" || this.abbr === "Cha";
		this.isPhysical = this.abbr === "Str" || this.abbr === "Dex" || this.abbr === "Con";
		this.key = this.name.toLowerCase();
	}

	/** 3 letter abbreviation of this.name */
	public readonly abbr: AbilityAbbr;

	/** Lowercased 3 letter abbreviation of this.name; used as the key in objects/maps */
	public readonly abbrKey: AbilityAbbrKey;

	/** This ability represents a mental ability (int/wis/cha). */
	public readonly isMental: boolean;

	/** This ability represents a physical ability (str/dex/con). */
	public readonly isPhysical: boolean;

	/** this.name.toLowerCase(); used as the key in objects/maps */
	public readonly key: AbilityKey;

	public toString() {
		return this.name;
	}

	private static _all = this.names().map(name => new Ability(name));
	public static all(): readonly Ability[] {
		return this._all;
	}

	public static findByName(ability: AbilityNameResolvable): Ability;
	public static findByName(name: Optional<string>): Ability | undefined;
	public static findByName(name: Optional<string>): Ability | undefined {
		if (!name) return undefined;
		const lower = name.toLowerCase();
		return Ability.all().find(ability => ability.abbrKey === lower || ability.key === lower);
	}

	public static isMental(ability: Optional<AbilityName>): ability is "Intelligence" | "Wisdom" | "Charisma";
	public static isMental(ability: Optional<AbilityAbbr>): ability is "Int" | "Wis" | "Cha";
	public static isMental(ability: Optional<AbilityKey>): ability is "intelligence" | "wisdom" | "charisma";
	public static isMental(ability: Optional<AbilityAbbrKey>): ability is "int" | "wis" | "cha";
	public static isMental(ability: Optional<string>): boolean {
		return this.findByName(ability)?.isMental === true;
	}

	public static isPhysical(ability: Optional<AbilityName>): ability is "Strength" | "Dexterity" | "Constitution";
	public static isPhysical(ability: Optional<AbilityAbbr>): ability is "Str" | "Dex" | "Con";
	public static isPhysical(ability: Optional<AbilityKey>): ability is "strength" | "dexterity" | "constitution";
	public static isPhysical(ability: Optional<AbilityAbbrKey>): ability is "str" | "dex" | "con";
	public static isPhysical(ability: Optional<string>): boolean {
		return this.findByName(ability)?.isPhysical === true;
	}

	public static isValid(ability: Optional<string>): ability is AbilityNameResolvable {
		return Ability.findByName(ability) !== undefined;
	}

	public static names(): readonly AbilityName[] {
		return AbilityNames;
	}

	/** Converts an Ability Score to an Ability Score Modifier. */
	public static scoreToMod(score: Optional<number>): number {
		if (!score) return 0;
		return Math.floor((score - 10) / 2);
	}
}