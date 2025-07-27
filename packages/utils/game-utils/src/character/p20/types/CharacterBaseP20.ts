import type { AbilityKey } from "./common.js";

/** Represents the different names we might have/use for a character. */
type CharacterNames = {
	/** Character's name. */
	name: string;
	/** (Optional) Character's nickname. */
	nick?: string;
	/** (Optional) A short name used to access the character via commands. */
	alias?: string;
	/** (Optional) Name of the player. */
	player?: string;
};

/** Contains the 6 ability scores and their modifiers. */
type Abilities = Record<AbilityKey, number | undefined> & Record<`${AbilityKey}Mod`, number | undefined>;

/** The known armor proficiency types. */
type ArmorProficiencyKey = "unarmored" | "light" | "medium" | "heavy";

/** The known weapon proficiency types. */
type WeaponProficiencyKey = "unarmed" | "simple" | "martial" | "advanced";

/** Represents the different proficiency levels. */
type Prof = "U" | "T" | "E" | "M" | "L";

/** Represents a gained proficiency. */
type Proficiency<T extends string = string> = {
	/** What we are gaining proficiency in; skill, save, etc. */
	name: T;
	/** What level of proficiency we are getting. */
	prof: Prof;
	/** (Optional) The level to apply the proficiency for planning. */
	level?: number;
};

/** The collection of proficiencies a character has. */
type Proficiencies = {
	/** Represents the various armor proficiencies. */
	armor: Proficiency<ArmorProficiencyKey>[];
	/** Represents the various lore proficiencies. */
	lores: Proficiency[];
	/** Represents any other proficiencies. */
	other: Proficiency[];
	/** Represents the various save proficiencies. */
	saves: Proficiency[];
	/** Represents the various skill proficiencies. */
	skills: Proficiency[];
	/** Represents the various weapon proficiencies. */
	weapons: Proficiency<WeaponProficiencyKey>[];
};

/** Represents a gained feat. */
type Feat = {
	/** Name of the feat. */
	name: string;
	/** (Optional) The level to apply the feat for planning. */
	level?: number;
};

/** Represents a part of the character that has feats; ancestry, background, etc. */
type HasFeats = {
	/** Name of the thing that has feats. */
	name: string;
	/** The collection of feats this character has from the thing. */
	feats: Feat[];
};

/** Represents a part of the character that has feats and features; class */
type HasFeatures = HasFeats & {
	/** (Optional) The key ability for the thing; for classes */
	keyAbility?: AbilityKey;
	/** The collection of features this character has from the thing. */
	features: Feat[];
};

/** Represents a common form of money. */
type ValueKey = "cp" | "sp" | "gp" | "pp" | "credits" | "bpu";

/** Represents the value of something. */
type Value = Record<ValueKey, number | undefined>;

/** Represents a piece of gear. */
type Gear = {
	/** Name of the piece of gear. */
	name: string;
	/** How many of this thing do we have. */
	count?: number;
	/** Is the item considered held? */
	held?: boolean;
	/** Is the item considered worn? */
	worn?: boolean;
	/** (Optional) The monetary value of the thing. */
	value?: Value;
};

type Equipment = {
	armor: string;
	shield: string;
	weapons: string[];
};

export type CharacterBaseP20Core = {
	names: CharacterNames;

	ancestry: HasFeats;
	background: HasFeats;
	classes: HasFeatures[];

	abilities: Abilities;

	proficiencies: Proficiencies;

	gear: Gear[];
	equipment: Equipment;
};
