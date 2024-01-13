import { warn } from "@rsc-utils/console-utils";

//#region EventListener and EventHandler
// type TEventListener<T> = (object: T) => void;
// interface IEventHandler<T> { eventName:string; listeners:TEventListener<T>[]; }

// let handlers: IEventHandler<any>[] = [];
// export namespace EventHandler {
// 	export function addListener<T>(eventName: string, listener: TEventListener<T>): void {
// 		let eventNames = (eventName || "").trim().split(/\s+/);
// 		eventNames.forEach(eventName => {
// 			let handler = handlers.find(h => h.eventName === eventName);
// 			if (!handler) {
// 				handlers.push(handler = { eventName:eventName, listeners:[] });
// 			}
// 			if (!handler.listeners.includes(listener)) {
// 				handler.listeners.push(listener);
// 			}
// 		});
// 	}
// 	export function fireEvent<T>(eventName: string, object: T): void {
// 		handlers.filter(h => h.eventName === eventName).forEach(h => h.listeners.forEach(l => l(object)));
// 	}
// }
//#endregion EventListener and EventHandler

export type GetStatPrefix = "" | "dc" | "mod" | "prof" | "proficiency";

//#region Abilities
export const STRENGTH = "Strength", DEXTERITY = "Dexterity", CONSTITUTION = "Constitution", INTELLIGENCE = "Intelligence", WISDOM = "Wisdom", CHARISMA = "Charisma";
export const ABILITIES: TAbility[] = [STRENGTH, DEXTERITY, CONSTITUTION, INTELLIGENCE, WISDOM, CHARISMA];
export type TAbility = "Strength" | "Dexterity" | "Constitution" | "Intelligence" | "Wisdom" | "Charisma";
//#endregion Abilities

//#region Alignments
export const LG = "LG", NG = "NG", CG = "CG", LN = "LN", N = "N", CN = "CN", LE = "LE", NE = "NE", CE = "CE";
export const ALIGNMENTS: TAlignment[] = [LG, NG, CG, LN, N, CN, LE, NE, CE];
export type TAlignment = "LG" | "NG" | "CG" | "LN" | "N" | "CN" | "LE" | "NE" | "CE";
//#endregion Alignments

//#region Magic Traditions
export const ARCANE = "Arcane", DIVINE = "Divine", OCCULT = "Occult", PRIMAL = "Primal";
export const MAGIC_TRADITIONS: TMagicTradition[] = [ARCANE, DIVINE, OCCULT, PRIMAL];
export type TMagicTradition = "Arcane" | "Divine" | "Occult" | "Primal";
//#endregion Magic Traditions

//#region Proficiencies
export const UNTRAINED = "Untrained", TRAINED = "Trained", EXPERT = "Expert", MASTER = "Master", LEGENDARY = "Legendary";
export const PROFICIENCIES: TProficiency[] = [UNTRAINED, TRAINED, EXPERT, MASTER, LEGENDARY];
export type TProficiency = "Untrained" | "Trained" | "Expert" | "Master" | "Legendary";
//#endregion Proficiencies

//#region Rarities
export const COMMON = "Common", UNCOMMON = "Uncommon", RARE = "Rare", UNIQUE = "Unique", SECRET = "Secret";
export const RARITIES: TRarity[] = [COMMON, UNCOMMON, RARE, UNIQUE, SECRET];
//ᵁᴿ
export type TRarity = "Common" | "Uncommon" | "Rare" | "Unique" | "Secret";
//#endregion Rarities

//#region Saving Throws
export const FORTITUDE = "Fortitude", REFLEX = "Reflex", WILL = "Will";
export type TSavingThrow = "Fortitude" | "Reflex" | "Will";
export function getSavingThrows<T extends string = TSavingThrow>(): T[] {
	return [FORTITUDE, REFLEX, WILL] as T[];
}
//#endregion Saving Throws

export function getExplorationModes(): string[] {
	return ["Avoid Notice", "Defend", "Detect Magic", "Follow the Expert", "Hustle", "Investigate", "Repeat a Spell", "Scout", "Search", "Other"];
}

export function getSkills(): string[] {
	return ["Perception", "Acrobatics", "Arcana", "Athletics", "Crafting", "Deception", "Diplomacy", "Intimidation", "Medicine", "Nature", "Occultism", "Performance", "Religion", "Society", "Stealth", "Survival", "Thievery"];
}

//#region Constants

/*
// export const WEAPON_SIMPLE = "Simple";
// export const WEAPON_MARTIAL = "Martial";
// export const WEAPON_ADVANCED = "Advanced";
// export const WEAPON_MELEE = "Melee";
*/
export const WEAPON_RANGED = "Ranged";
export const SIMPLE_WEAPONS = "Simple Weapons";
export const MARTIAL_WEAPONS = "Martial Weapons";
export const ADVANCED_WEAPONS = "Advanced Weapons";
export const ALCHEMICAL_BOMBS = "Alchemical Bombs";

export const NO_ARMOR = "No Armor";
export const ARMOR_UNARMORED = "Unarmored";
/*
// export const ARMOR_LIGHT = "Light";
// export const ARMOR_MEDIUM = "Medium";
// export const ARMOR_HEAVY = "Heavy";
*/
export const LIGHT_ARMOR = "Light Armor";
export const MEDIUM_ARMOR = "Medium Armor";
export const HEAVY_ARMOR = "Heavy Armor";
/*
// export const ALL_ARMOR = "All Armor";
*/

export const NO_SHIELD = "No Shield";
/*
// export const SHIELDS = "Shields";
*/

export const AC = "AC";
export const ARMOR_CLASS = "Armor Class";

export const POSITIVE = "Positive";
export const NEGATIVE = "Negative";

export const PERCEPTION = "Perception";
export const CIRCUMSTANCE = "Circumstance";
export const ITEM = "Item";
export const STATUS = "Status";
export const UNTYPED = "Untyped";

export const LIGHT_BULK = "L";
export const DASH = "-";
export const MDASH = "—";
export const NEWLINE = "\n";
export const TAB = "\t";

//#endregion

//#region Types

export type TAction = "[A]" | "[AA]" | "[A][A]" | "[AAA]" | "[A][A][A]" | "[F]" | "[R]" | "[[A]]" | "[[A]][[A]]" | "[[A]][[A]][[A]]" | "[[F]]" | "[[R]]";/*// | "Activity";*/
export type TArmorCategory = "Light" | "Medium" | "Heavy" | "Shields";
/*// export type TArmorClassType = "AC" | "TAC";*/
export type TBonusType = "Circumstance" | "Item" | "Status" | "Untyped";
export type TCasterType = "Innate" | "Prepared" | "Spontaneous";
export type TChannelType = "Positive" | "Negative";
/*// export type TDamageType = TWeaponDamageType | TEnergyDamageType;*/
export type TEnergyDamageType = "Acid" | "Cold" | "Electricity" | "Fire";
export type TEquipmentType = "Armor" | "Gear" | "Item" | "Shield" | "Weapon";
export type TMagicComponent = "Material" | "Somatic" | "Verbal";
export type TQuality = "Standard" | "Expert" | "Master" | "Legendary";
export type TSize = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
export type TSkill = "Acrobatics" | "Arcana" | "Athletics" | "Crafting" | "Deception" | "Diplomacy" | "Intimidation" | "Lore" | "Medicine" | "Nature" | "Occultism" | "Performance" | "Religion" | "Society" | "Stealth" | "Survival" | "Thievery";
export type TShieldCategory = "Shields";
export type TSpeedType = "Land" | "Climb" | "Swim" | "Fly" | "Burrow";

export type TWeaponCategory = "Unarmed" | "Simple" | "Martial" | "Advanced";
export type TWeaponGroup = "Axe" | "Bomb" | "Bow" | "Brawling" | "Club" | "Dart" | "Flail" | "Hammer" | "Knife" | "Pick" | "Polearm" | "Shield" | "Sling" | "Spear" | "Sword";
export type TWeaponHands = "1" | "1+" | "2";
export type TWeaponType = "Unarmed" | "Melee" | "Ranged";
export type TWeaponDamageType = "Bludgeoning" | "Piercing" | "Slashing";

export type TNumberKeyMap<T> = { [key: number]: T; };
export type TStringKeyMap<T> = { [key: string]: T; };

//#endregion

//#region Interfaces

export type TContentObject = {
	contents: TContentItemArray;
	name: string;
	objectType: string;
	quantity: number;
};
export type TContentItem = string | TContentObject;
export type TContentItemArray = (string | TContentObject)[];

export type TObjectQuantity<T> = { contents: TObjectQuantity<T>[]; object: T, quantity: number; };

export interface IHasContents {
	contents: TContentItemArray;
}
export interface HasContents<T extends IHasContents | HasContents<T>> {
	contents: TObjectQuantity<T>[];
	hasContents: boolean;
}

export interface IHasParent {
	parent: string;
}
export interface HasParent<T> {
	children: T[];
	hasChildren: boolean;
	hasParent: boolean;
	parent?: T;
}

export interface IHasQuantity {
	quantity: number;
}
export interface HasQuantity<T extends IHasQuantity> {
	quantity: number;
	_?: T;
}

export interface IAbilityScores {
	str: number;
	dex: number;
	con: number;
	int: number;
	wis: number;
	cha: number;
}
export interface IAbilityModifiers {
	strMod: number;
	dexMod: number;
	conMod: number;
	intMod: number;
	wisMod: number;
	chaMod: number;
}

export interface IAttack {
	action: TAction;
	type: "Melee" | "Ranged";
	name: string;
	traits: string[];
	modifier: number;
	touch: boolean;
	damage?: IDamage[];
	effect?: string;
}

export interface IDamage {
	dice: string;
	type: string; // TDamageType
	plus: string;
}

export interface IGenericBlock {
	name: string;
	traits: string[];
	details: string[];
}

export interface ISavingThrow {
	type: TSavingThrow;
	dc: number;
}

export interface IPoisonStage {
	stage: number;
	effect: string;
}
export interface IPoison {
	objectType: "Poison";
	name: string;
	traits: string[];
	savingThrow: ISavingThrow;
	maxDuration: string;
	stages: IPoisonStage[];
}

export interface IAura {
	objectType: "Aura";
	name: string;
	traits: string[];
	range: string;
	details: string[];
}

export interface ISourceReference {
	name: string;
	page: number;
}

//#endregion

//#region Helper Functions

export function profToMod(prof: TProficiency): number {
	switch (prof) {
		case UNTRAINED: return 0;
		case TRAINED: return 2;
		case EXPERT: return 4;
		case MASTER: return 6;
		case LEGENDARY: return 8;
		default:
			warn(`Invalid Proficiency: ${prof}`);
			return 0;
	}
}
export function minProf(a: TProficiency, b: TProficiency): TProficiency {
	const aMod = profToMod(a),
		bMod = profToMod(b);
	if (aMod === bMod) {
		return a;
	}
	return aMod < bMod ? a : b;
}
export function toModifier(value: number): string {
	return (value < 0 ? "" : "+") + String(value);
}
export function rarityToSuper(rarity: TRarity): string {
	if (rarity === "Rare") {
		return "ᴿ";
	}
	return rarity === "Uncommon" ? "ᵁ" : "";
}

//#endregion
