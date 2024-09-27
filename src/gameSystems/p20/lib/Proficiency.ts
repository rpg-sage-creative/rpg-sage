import type { Optional } from "@rsc-utils/core-utils";

export type ProficiencyName = "Untrained" | "Trained" | "Expert" | "Master" | "Legendary";
export type ProficiencyKey = Lowercase<ProficiencyName>;

export type ProficiencyAbbr = "U" | "T" | "E" | "M" | "L";
export type ProficiencyAbbrKey = Lowercase<ProficiencyAbbr>;

export class Proficiency {
	public constructor(public name: ProficiencyName) {
		this.abbr = this.name[0] as ProficiencyAbbr;
		this.abbrKey = this.abbr.toLowerCase() as ProficiencyAbbrKey;
		this.key = this.name.toLowerCase() as ProficiencyKey;
		this.modifier = Proficiency.names().indexOf(this.name) * 2;
	}

	/** 3 letter abbreviation of this.name */
	public readonly abbr: ProficiencyAbbr;

	/** Lowercased 3 letter abbreviation of this.name; used as the key in objects/maps */
	public readonly abbrKey: ProficiencyAbbrKey;

	/** this.name.toLowerCase(); used as the key in objects/maps */
	public readonly key: ProficiencyKey;

	public readonly modifier: number;

	private static _all: Proficiency[];
	public static all(): Proficiency[] {
		return Proficiency._all ?? (Proficiency._all = Proficiency.names().map(name => new Proficiency(name)));
	}

	public static findByModifier(modifier: Optional<number>): Proficiency | undefined {
		if (!modifier) return undefined;
		if (modifier === -2) return Proficiency.findByName("U");
		return Proficiency.findByName(["U", "T", "E", "M", "L"][modifier / 2]);
	}

	public static findByName(proficiency: ProficiencyName | ProficiencyAbbr | ProficiencyKey | ProficiencyAbbrKey): Proficiency;
	public static findByName(name: Optional<string>): Proficiency | undefined
	public static findByName(name: Optional<string>): Proficiency | undefined {
		if (!name) return undefined;
		// if we have a valid name, we also have a valid abbr; this is faster and allows for simple typos
		const abbrKey = name[0].toLowerCase();
		return Proficiency.all().find(proficiency => proficiency.abbrKey === abbrKey);
	}

	public static isValid(proficiency: Optional<string>): proficiency is ProficiencyName | ProficiencyAbbr | ProficiencyKey | ProficiencyAbbrKey {
		return Proficiency.findByName(proficiency) !== undefined;
	}

	private static _names: ProficiencyName[];
	public static names(): ProficiencyName[] {
		return Proficiency._names ?? (Proficiency._names = ["Untrained", "Trained", "Expert", "Master", "Legendary"]);
	}

	/** Converts an Proficiency Score to an Proficiency Score Modifier. */
	public static toMod(name: ProficiencyName | ProficiencyAbbr | ProficiencyKey | ProficiencyAbbrKey, untrainedPenalty?: boolean): number {
		const proficiency = Proficiency.findByName(name);
		if (!proficiency) return 0;
		if (proficiency.abbr === "U" && untrainedPenalty) return -2;
		return proficiency.modifier;
	}
}