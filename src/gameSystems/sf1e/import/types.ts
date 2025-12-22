import type { CharacterBaseCore } from "@rsc-utils/game-utils";
import type { SkillName } from "../lib/Skill.js";

type Bonus = {
	/** only one of each "type" can apply */
	type: string;
	/** class / race / feat / etc that gives the bonus */
	source: string;
};

type ValueBonus = Bonus & {
	/** numerical modifier */
	value: number;
};

export type HephaistosCharacterSF1eConditionKey =
	| "asleep"
	| "bleeding"
	| "blinded"
	| "broken"
	| "burning"
	| "confused"
	| "cowering"
	| "dazed"
	| "dazzled"
	| "dead"
	| "deafened"
	| "dying"
	| "encumbered"
	| "entangled"
	| "exhausted"
	| "fascinated"
	| "fatigued"
	| "flatFooted"
	| "frightened"
	| "grappled"
	| "helpless"
	| "nauseated"
	| "offKilter"
	| "offTarget"
	| "overburdened"
	| "panicked"
	| "paralyzed"
	| "pinned"
	| "prone"
	| "shaken"
	| "sickened"
	| "stable"
	| "staggered"
	| "stunned"
	| "unconscious";

export type HephaistosCharacterSF1eConditionState = {
	active: boolean;
	/** default: "" */
	notes: string;
};

export type HephaistosCharacterSF1eAbilityName = "Strength" | "Dexterity" | "Constitution" | "Intelligence" | "Wisdom" | "Charisma";
export type HephaistosCharacterSF1eAbilityKey = Lowercase<HephaistosCharacterSF1eAbilityName>;

export type HephaistosCharacterSF1eAbilityScore = {
	total: number;
	base: unknown | null;
	override: unknown | null;
	increases: number;
	pointBuy: number;
	damage: number;
	scoreBonuses: ValueBonus[];
	modifierBonuses: ValueBonus[];
	/** default: "" */
	notes: string;
};


export type HephaistosCharacterSF1eSkill = {
	total: number;
	override: unknown | null;
	skill: SkillName;
	name: string | null;
	ranks: number;
	bonuses: ValueBonus[];
	ability: HephaistosCharacterSF1eAbilityKey;
	classSkill: boolean;
	trainedOnly: boolean;
	/** default: "" */
	notes: string;
};

export type HephaistosCharacterSF1eVitalsInfo = {
	max: number;
	override: unknown | null;
	damage: number;
	bonuses: ValueBonus[];
	/** default: "" */
	notes: string;
};

export type HephaistosCharacterSF1eVitals = {
	temporary: number;
	stamina: HephaistosCharacterSF1eVitalsInfo;
	health: HephaistosCharacterSF1eVitalsInfo;
	resolve: HephaistosCharacterSF1eVitalsInfo;
};

export type HephaistosCharacterSF1eAC = {
	total: number;
	override: unknown | null;
	bonuses: ValueBonus[];
	/** default: "" */
	notes: string;
};
export type HephaistosCharacterSF1eArmorClass = {
	/** energy armor class */
	eac: HephaistosCharacterSF1eAC;
	/** kinetic armor class */
	kac: HephaistosCharacterSF1eAC;
	acVsCombatManeuver: HephaistosCharacterSF1eAC;
};

export type HephaistosCharacterSF1eSaveName = "Fortitude" | "Reflex" | "Will";
export type HephaistosCharacterSF1eSaveKey = Lowercase<HephaistosCharacterSF1eSaveName>;
export type HephaistosCharacterSF1eSavingThrow = {
	total: number;
	override: unknown | null;
	base: number;
	bonuses: ValueBonus[];
	ability: HephaistosCharacterSF1eAbilityKey;
	/** default: "" */
	notes: string;
};

export type HephaistosCharacterSF1eAttackBonus = {
	total: number;
	override: unknown | null;
	ability: HephaistosCharacterSF1eAbilityKey;
	bonuses: ValueBonus[];
	/** default: "" */
	notes: string;
};

export type HephaistosCharacterSF1eSourceReference = {
	name: string;
	shortName: string;
	page: number;
};

export type HephaistosCharacterSF1eBulk = {
	current: {
		total: number;
		override: unknown | null;
		notes: string;
	};
	encumbered: {
		limit: number;
	};
	overburdened: {
		limit: number;
		override: unknown | null;
		notes: string;
	};
};
export type HephaistosCharacterSF1eSpeed = {
	/** default: "" */
	notes: string;
	land: number;
	flyPerfect?: number;
};
export type HephaistosCharacterSF1eInitiative = {
	total: number;
	bonuses: ValueBonus[];
	/** default: "" */
	notes: string;
};
export type HephaistosCharacterSF1eResistances = {
	/** damage resistance */
	dr: { [key: string]: unknown; };
	/** energy resistance */
	er: { [key: string]: unknown; };
	/** spell resistance */
	sr: number;
};
export type HephaistosCharacterSF1eAttackBonuses = {
	bab: {
		total: number;
		base: number;
		/** default: "" */
		notes: string;
	};
	melee: HephaistosCharacterSF1eAttackBonus;
	ranged: HephaistosCharacterSF1eAttackBonus;
	thrown: HephaistosCharacterSF1eAttackBonus;
	otherBonuses: unknown[];
};
export type WeaponDamage = {
	dice: {
		count: number;
		sides: number;
	};
	damage: string[];
	alternateDamage: unknown[] | null;
};
export type HephaistosCharacterSF1eInventoryItem = {
	/** "Weapon" | "Armor" | string */
	type: "Weapon" | "Armor" | string;
	id: string;
	name: string;
	description: string;
	level: number;
	price: number;
	bulk: number;
	weaponType: string;
	handedness: number;
	category: string | null;
	toHit: number;
	damage?: WeaponDamage;
	damageBonus: number;
	critical: {name:string;additionalInfo:string;} | null;
	special: {
		name: string;
		additionalInfo: unknown | null;
	}[];
	range: number | null;
	capacity: number | null;
	ammunitionType: string | null;
	ammunitionId: unknown | null;
	usage: number | null;
	accessoryIds: unknown[];
	fusionIds: unknown[];
	reference: HephaistosCharacterSF1eSourceReference;
	isEquipped: boolean;
	stashed: boolean;
	proficient: boolean;
	specialization: boolean;
	notes: string;
	quantity: number;
	tags: unknown[];
};
type AbilityScores = {
	strength: HephaistosCharacterSF1eAbilityScore;
	dexterity: HephaistosCharacterSF1eAbilityScore;
	constitution: HephaistosCharacterSF1eAbilityScore;
	intelligence: HephaistosCharacterSF1eAbilityScore;
	wisdom: HephaistosCharacterSF1eAbilityScore;
	charisma: HephaistosCharacterSF1eAbilityScore;
	increases?: unknown[];
	method: "Rolling" | "Point Buy";
}
export type HephaistosCharacterCoreSF1e = CharacterBaseCore<"HephaistosCharacterSF1e"> & {
	version: {
		/** 1 */
		major: number;
		/** 7 */
		minor: number;
	};
	type: "character";
	name: string;
	/** default: "" */
	description: string;
	/** default: "" */
	gender: string;
	/** default: "" */
	homeworld: string;
	/** default: "" */
	deity: string;
	/** default: "" */
	alignment: string;
	/** default: "" */
	quickNotes: string;
	/** default: "" */
	languages: string;
	/** default: "" */
	campaignNotes: string;
	situationalBonuses: Bonus[];
	conditions: Record<HephaistosCharacterSF1eConditionKey, HephaistosCharacterSF1eConditionState>;
	negativeLevels: { permanent: number; temporary: number; };
	afflictions: unknown[];
	abilityScores: AbilityScores;
	skills: HephaistosCharacterSF1eSkill[];
	vitals: HephaistosCharacterSF1eVitals;
	speed: HephaistosCharacterSF1eSpeed;
	initiative: HephaistosCharacterSF1eInitiative;
	armorClass: HephaistosCharacterSF1eArmorClass;
	resistances: HephaistosCharacterSF1eResistances;
	saves: Record<HephaistosCharacterSF1eSaveKey, HephaistosCharacterSF1eSavingThrow>;
	attackBonuses: HephaistosCharacterSF1eAttackBonuses;
	race: {
		name: string;
		description: string;
		size: string;
		hitPoints: number;
		selectedTraits: {
			name: string;
			description: string;
			selectedOptions: unknown | null;
		}[];
		abilityAdjustment: {
			name: string;
			description: string;
			adjustment: string[];
		};
		speed: {
			land: number;
		};
		reference: HephaistosCharacterSF1eSourceReference;
	};
	theme: {
		name: string;
		bonus: string;
		description: string;
		benefits: {
			name: string;
			level: number;
			description: string;
			selectedOptions: unknown | null;
		}[];
		reference: HephaistosCharacterSF1eSourceReference;
	};
	classes: {
		name: string;
		description: string;
		baseHitPoints: number;
		baseStaminaPoints: number;
		baseSkillRanksPerLevel: number;
		keyAbility: HephaistosCharacterSF1eAbilityKey;
		levels: number;
		spells: unknown[];
		spellsUsed: unknown[];
		spellsKnown: number[];
		spellsPerDay: number[];
		baseAttackBonus: number;
		savingThrows: {
			fortitude: number;
			reflex: number;
			will: number;
		};
		classSkills: SkillName[];
		features: {
			name: string;
			description: string;
			options: {
				name: string;
				description: string;
				effects: unknown[];
			}[];
		}[];
		archetype: unknown | null;
	}[];
	freeArchetypes: {
		name: string;
		description: string;
		features: unknown[];
	}[];
	feats: {
		acquiredFeats: {
			name: string;
			description: string;
			prerequisite: unknown | null;
			benefit: string;
			benefitEffect: unknown | null;
			normal: string;
			special: unknown | null;
			isCombatFeat: boolean;
			selectedOptions: unknown | null;
			reference: HephaistosCharacterSF1eSourceReference;
		}[];
		notes: string;
	};
	inventory: HephaistosCharacterSF1eInventoryItem[];
	bulk: HephaistosCharacterSF1eBulk;
	credits: number;
	upbs: number;
	senses: {
		senseType: string;
		additionalInfo: unknown | null;
		range: number;
	}[];
	counters: unknown[];
	additionalSpells: unknown[];
	drone: {
		name: string;
		level: number;
		description: string;
		conditions: Record<HephaistosCharacterSF1eConditionKey, HephaistosCharacterSF1eConditionState>;
		abilityScores: AbilityScores;
		skills: HephaistosCharacterSF1eSkill[];
		vitals: HephaistosCharacterSF1eVitals;
		speed: HephaistosCharacterSF1eSpeed;
		initiative: HephaistosCharacterSF1eInitiative;
		armorClass: HephaistosCharacterSF1eArmorClass;
		resistances: HephaistosCharacterSF1eResistances;
		saves: Record<HephaistosCharacterSF1eSaveKey, HephaistosCharacterSF1eSavingThrow>;
		attackBonuses: HephaistosCharacterSF1eAttackBonuses;
		chassis: {
			name: string;
			description: string;
			size: string;
			speed: { land: number; };
			eac: number;
			kac: number;
			goodSaves: HephaistosCharacterSF1eSaveName[];
			poorSaves: HephaistosCharacterSF1eSaveName[];
			strength: number;
			dexterity: number;
			intelligence: number;
			wisdom: number;
			charisma: number;
			abilityIncreases: HephaistosCharacterSF1eSaveName[];
			bonusSkillUnit: SkillName[];
			reference: HephaistosCharacterSF1eSourceReference;
		};
		specialAbilities: {
			name: string;
			description: string;
			options: {
				name: string;
				description: string;
				effects: {name:string;description:string;}[];
			}[];
		}[];
		feats: {
			acquiredFeats: {
				name: string;
				description: string;
				prerequisite: string | null;
				benefit: string;
				benefitEffect: {append:{value:{weaponType:string;};property:string;}}[];
				normal: unknown | null;
				special: unknown | null;
				isCombatFeat: boolean;
				selectedOptions: unknown | null;
				reference: HephaistosCharacterSF1eSourceReference;

			}[];
			notes: string;
		};
		mods: {
			installedMods: {
				name: string;
				description: string;
				selectedOptions: unknown | null;
				reference: HephaistosCharacterSF1eSourceReference;
			}[];
		}
		inventory: HephaistosCharacterSF1eInventoryItem[];
		bulk: HephaistosCharacterSF1eBulk;
		weaponMounts: {
			melee: {
				total: number;
				bonuses: ValueBonus[];
			};
			ranged: {
				total: number;
				bonuses: ValueBonus[];
			};
		}
	} | null;
}
