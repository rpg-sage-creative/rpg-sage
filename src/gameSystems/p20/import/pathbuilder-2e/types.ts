import type { CharacterBaseCore } from "@rsc-utils/character-utils";
import type { AbilityAbbr, AbilityAbbrKey } from "../../../d20/lib/Ability.js";
import type { ProficiencyType, SizeType } from "../../lib/types.js";

export type TPathbuilderCharacterAbilityKey = keyof Omit<TPathbuilderCharacterAbilities, "breakdown">;

type BreakdownAbility = AbilityAbbr | AbilityAbbrKey;

export type TPathbuilderCharacterAbilities = {
	str: number; // 16
	dex: number; // 12
	con: number; // 12
	int: number; // 10
	wis: number; // 10
	cha: number; // 10
	breakdown?: {
		ancestryFree: BreakdownAbility[];
		ancestryBoosts: BreakdownAbility[];
		ancestryFlaws: BreakdownAbility[];
		backgroundBoosts: BreakdownAbility[];
		classBoosts: BreakdownAbility[];
		mapLevelledBoosts: {
			[level: string]: BreakdownAbility[];
		}
	}
};

type TPathbuilderCharacterArmorClassTotal = {
	acProfBonus: number;
	acAbilityBonus: number;
	acItemBonus: number;
	acTotal: number;
	shieldBonus?: number;
};

export type TPathbuilderCharacterArmor = {
	name: string;
	qty: number;
	/** "light" */
	prof: string;
	/** potency: +1 */
	pot: number;
	/** Resilient, Greater Resilient, Major Resilient */
	res: "resilient" | "greater resilient" | "major resilient" | "" | 0;
	/** material */
	mat: null;
	display: string;
	worn: boolean;
	runes: string[];
};

type TPathbuilderCharacterAttributes = {
	ancestryhp: number;      // 8
	classhp: number;         // 10
	bonushp: number;         // 0
	bonushpPerLevel: number; // 0
	speed: number;           // 25
	speedBonus: number;      // 0
};

/**
 * [ [name, null, type, level, `${source} Feat ${level}`, "standardChoice", null] ]
 * source: Ancestry | Awarded (Hephaistos?) | Class | General | Skill
 */
export type TPathbuilderCharacterFeat = [string, null, string, number] | [string, null, string, number, string, string, null];

/** [ [name, profMod] ] */
export type TPathbuilderCharacterLore = [string, number];

/** [ [name, count] | [name, count, "Invested"] | [name, count, containerId, "Invested"] ] */
export type TPathbuilderCharacterEquipment = [string, number] | [string, number, string] | [string, number, string, string];
export type TPathbuilderEquipmentContainers = { [key: string]: { containerName:string; bagOfHolding:boolean; backpack:boolean; } };

type TPathbuilderCharacterFormula = {
	/** "other" */
	type: string;
	known: string[];
};

export type TPathbuilderCharacterMoney = {
	pp?: number;
	gp?: number;
	sp?: number;
	cp?: number;
	credits?: number;
	upb?: number;
};

export type TPathbuilderCharacterProficienciesKey = keyof TPathbuilderCharacterProficiencies;
export type TPathbuilderCharacterProficiencies = {
	classDC: ProficiencyType;
	perception: ProficiencyType;
	fortitude: ProficiencyType;
	reflex: ProficiencyType;
	will: ProficiencyType;
	heavy: ProficiencyType;
	medium: ProficiencyType;
	light: ProficiencyType;
	unarmored: ProficiencyType;
	advanced: ProficiencyType;
	martial: ProficiencyType;
	simple: ProficiencyType;
	unarmed: ProficiencyType;
	castingArcane: ProficiencyType;
	castingDivine: ProficiencyType;
	castingOccult: ProficiencyType;
	castingPrimal: ProficiencyType;
	acrobatics: ProficiencyType;
	arcana: ProficiencyType;
	athletics: ProficiencyType;
	crafting: ProficiencyType;
	deception: ProficiencyType;
	diplomacy: ProficiencyType;
	intimidation: ProficiencyType;
	medicine: ProficiencyType;
	nature: ProficiencyType;
	occultism: ProficiencyType;
	performance: ProficiencyType;
	religion: ProficiencyType;
	society: ProficiencyType;
	stealth: ProficiencyType;
	survival: ProficiencyType;
	thievery: ProficiencyType;
	// Starfinder Hack
	piloting?: ProficiencyType;
	computers?: ProficiencyType;
};

type TPathbuilderCharacterSpecificProficiencies = {
	trained: string[];
	expert: string[];
	master: string[];
	legendary: string[];
};


type TPathbuilderCharacterFocus = {
	arcane?: TPathbuilderCharacterFocusTradition;
	divine?: TPathbuilderCharacterFocusTradition;
	occult?: TPathbuilderCharacterFocusTradition;
	primal?: TPathbuilderCharacterFocusTradition;
};

export type TPathbuilderCharacterFocusTradition = {
	int?: TPathbuilderCharacterFocusStat;
	wis?: TPathbuilderCharacterFocusStat;
	cha?: TPathbuilderCharacterFocusStat;
};

export type TPathbuilderCharacterFocusStat = {
	abilityBonus: number;
	proficiency: number;
	itemBonus: number;
	focusCantrips: string[];
	focusSpells: string[];
};

export type TPathbuilderCharacterSpellCaster = {
	/** "Cleric Font" | "Caster Arcane Sense" | "Wizard" | ... */
	name: string;

	/** "divine" | "arcane" | ... */
	magicTradition: TPathbuilderCharacterTraditionKey;

	/** "prepared" | "" */
	spellcastingType: string;

	/** "int" | "wis" | ... */
	ability: TPathbuilderCharacterAbilityKey;

	/** 0, 2, 4, 6, 8 */
	proficiency: ProficiencyType;

	/** 0 */
	focusPoints: number;

	innate: boolean;

	/** [0, ..., 10] */
	perDay: number[];

	/** known */
	spells: TPathbuilderCharacterSpellCasterSpells[];

	/** prepared */
	prepared: TPathbuilderCharacterSpellCasterSpells[];

	/** ?? */
	blendedSpells: [];

};

export type TPathbuilderCharacterSpellCasterSpells = {
	spellLevel: number;
	/** spell name, for instance: "Heal" */
	list: string[];
};

type TPathbuilderCharacterTraditionKey = "arcane" | "divine" | "focus" | "occult" | "primal";

export type StrikingRune = "striking" | "greater striking" | "major striking";

export type WeaponGrade = "commercial" | "tactical" | "advanced" | "superior" | "elite" | "ultimate" | "paragon";

export type TPathbuilderCharacterWeapon = {
	name: string;
	qty: number;
	/* proficiency: "martial" */
	prof: string;
	/* "d6" */
	die: `d${number}`;
	/* potency: +1 */
	pot: number;
	/* Striking, Greater Striking, Major Striking */
	str: StrikingRune | "";
	/* material */
	mat: null;
	display: string;
	runes: string[];
	/** "P" */
	damageType: string;
	/** attack mod */
	attack: number;
	damageBonus: number;
	/** [ "+3 Spirit", ... ] */
	extraDamage: string[];
	increasedDice: boolean;
	isInventor: boolean;
	/** [1d20 +mod atk; XdY dmg] */
	dice?: string;
	/** SF2e: commercial, tactical, advanced, superior, elite, ultimate, paragon */
	grade?: WeaponGrade | "";
};

export type TPathbuilderCharacterFamiliar = {
	type: "Familiar";
	/** type === "Familiar" && specific === "Faerie Dragon"  >>  Faerie Dragon (name) */
	name: string;
	/** "Faerie Dragon" */
	specific: string;
	abilities: string[];
};

export type TPathbuilderCharacterAnimalCompanion = {
	type: "Animal Companion";
	/** "Badger" */
	animal: string;
	/** "Young Badger" */
	name: string;
	mature: boolean;
	incredible: boolean;
	/** "Nimble" */
	incredibleType: string;
	specializations: [];
	/** "Unarmored" */
	armor: string;
	equipment: [];
};

type TPathbuilderCharacterPet = TPathbuilderCharacterFamiliar
	| TPathbuilderCharacterAnimalCompanion
	| { name:string; type:"Other"; };

export type TPathbuilderCharacterCustomFlags = {
	_proficiencyWithoutLevel?: boolean;
	_untrainedPenalty?: boolean;
};

// type TPathbuilderCharacterCustomFlag = keyof TPathbuilderCharacterCustomFlags;

/** @todo Clean this up! */
export type PathbuilderCharacterCore = CharacterBaseCore<"PathbuilderCharacter" | "P20Character"> & TPathbuilderCharacterCustomFlags & {
	// name (core) // "Unknown Adventurer"

	/** default: "Fighter" */
	class: string; // "Fighter"

	dualClass: string | null;

	/** default: 1 */
	level: number; // 1

	xp: number;

	/** default: "Human" */
	ancestry: string;

	/** default: "" */
	heritage: string | null;

	/** default: Barkeep" */
	background: string;

	/** @deprecated default: "N" */
	alignment?: string;

	/** default: "Not set" */
	gender: string;

	/** default: "Not set" */
	age: string;

	/** default: "Not set" */
	deity: string;

	/** default: 2 */
	size: SizeType;

	/** default: "Medium" */
	sizeName?: keyof typeof SizeType;

	/** default: "str" */
	keyability: TPathbuilderCharacterAbilityKey;

	/** default: ["None selected"] */
	languages: string[];
	rituals?: string[]; // []
	resistances?: []; // []
	inventorMods?: []; // []
	attributes: TPathbuilderCharacterAttributes;
	abilities: TPathbuilderCharacterAbilities;
	proficiencies: TPathbuilderCharacterProficiencies;
	mods?: Record<string, { "Untyped Bonus"?:number; "Potency Bonus"?:number; "Item Bonus"?:number; }>,
	feats: TPathbuilderCharacterFeat[];
	specials: string[];
	lores: TPathbuilderCharacterLore[];
	equipmentContainers?: { [key: string]: { containerName:string; bagOfHolding:boolean; backpack:boolean; } };
	equipment: TPathbuilderCharacterEquipment[];
	specificProficiencies?: TPathbuilderCharacterSpecificProficiencies;
	weapons: TPathbuilderCharacterWeapon[];
	money: TPathbuilderCharacterMoney;
	armor: TPathbuilderCharacterArmor[];
	spellCasters: TPathbuilderCharacterSpellCaster[];
	focusPoints?: number;
	focus?: TPathbuilderCharacterFocus;
	formula: TPathbuilderCharacterFormula[];
	acTotal?: TPathbuilderCharacterArmorClassTotal;
	pets: TPathbuilderCharacterPet[];
	familiars?: [];
	exportJsonId?: number;
};
