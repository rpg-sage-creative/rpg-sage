import { ABILITIES } from "../..";
import type { TMacro } from "../../../sage-lib/sage/model/User";
import utils, { Optional, OrUndefined } from "../../../sage-utils";
import type { TProficiency, TSavingThrow } from "../../common";
import { toModifier } from "../../common";
import { filter as repoFilter, findByValue as repoFind } from "../../data/Repository";
import type Weapon from "../Weapon";
import type { IHasAbilities } from "./Abilities";
import Abilities from "./Abilities";
import type { IHasProficiencies } from "./PlayerCharacter";
import type { IHasSavingThrows } from "./SavingThrows";
import SavingThrows from "./SavingThrows";

const skillNames = "Acrobatics,Arcana,Athletics,Crafting,Deception,Diplomacy,Intimidation,Medicine,Nature,Occultism,Performance,Religion,Society,Stealth,Survival,Thievery".split(",");
const skillStatKeys: TMythWeaversCharacterAbilityKey[] = ["dex", "int", "str", "int", "cha", "cha", "cha", "wis", "wis", "int", "cha", "wis", "int", "dex", "wis", "dex"];
const saveNames = ["Fortitude", "Reflex", "Will"];
// const saveStatKeys: TMythWeaversCharacterAbilityKey[] = ["con", "dex", "wis"];

//#region types

enum MythWeaversCharacterProficiencyType {
	PenalizedUntrained = -2,
	Untrained = 0,
	Trained = 2,
	Expert = 4,
	Master = 6,
	Legendary = 8
}

enum MythWeaversCharacterSizeType {
	Tiny = 0,
	Small = 1,
	Medium = 2,
	Large = 3,
	Huge = 4
}

export type TMythWeaversCharacterAbilityKey = keyof TMythWeaversCharacterAbilities;

type TMythWeaversCharacterAbilities = {
	str: number;
	dex: number;
	con: number;
	int: number;
	wis: number;
	cha: number;
};

type TMythWeaversCharacterArmorClassTotal = {
	acProfBonus: number;
	acAbilityBonus: number;
	acItemBonus: number;
	acTotal: number;
};

type TMythWeaversCharacterArmor = {
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

type TMythWeaversCharacterAttributes = {
	ancestryhp: number;
	classhp: number;
	bonushp: number;
	bonushpPerLevel: number;
	speed: number;
	speedBonus: number;
};

/** [ [name, null, type, level] ] */
type TMythWeaversCharacterFeat = [string, null, string, number];

/** [ [name, profMod] ] */
type TMythWeaversCharacterLore = [string, number];

/** [ [name, count] ] */
type TMythWeaversCharacterEquipment = [string, number];

type TMythWeaversCharacterFormula = {
	/** "other" */
	type: string;
	known: string[];
};

type TMythWeaversCharacterMoney = {
	pp: number;
	gp: number;
	sp: number;
	cp: number;
};

type TMythWeaversCharacterProficienciesKey = keyof TMythWeaversCharacterProficiencies;
type TMythWeaversCharacterProficiencies = {
	classDC: MythWeaversCharacterProficiencyType;
	perception: MythWeaversCharacterProficiencyType;
	fortitude: MythWeaversCharacterProficiencyType;
	reflex: MythWeaversCharacterProficiencyType;
	will: MythWeaversCharacterProficiencyType;
	heavy: MythWeaversCharacterProficiencyType;
	medium: MythWeaversCharacterProficiencyType;
	light: MythWeaversCharacterProficiencyType;
	unarmored: MythWeaversCharacterProficiencyType;
	advanced: MythWeaversCharacterProficiencyType;
	martial: MythWeaversCharacterProficiencyType;
	simple: MythWeaversCharacterProficiencyType;
	unarmed: MythWeaversCharacterProficiencyType;
	castingArcane: MythWeaversCharacterProficiencyType;
	castingDivine: MythWeaversCharacterProficiencyType;
	castingOccult: MythWeaversCharacterProficiencyType;
	castingPrimal: MythWeaversCharacterProficiencyType;
	acrobatics: MythWeaversCharacterProficiencyType;
	arcana: MythWeaversCharacterProficiencyType;
	athletics: MythWeaversCharacterProficiencyType;
	crafting: MythWeaversCharacterProficiencyType;
	deception: MythWeaversCharacterProficiencyType;
	diplomacy: MythWeaversCharacterProficiencyType;
	intimidation: MythWeaversCharacterProficiencyType;
	medicine: MythWeaversCharacterProficiencyType;
	nature: MythWeaversCharacterProficiencyType;
	occultism: MythWeaversCharacterProficiencyType;
	performance: MythWeaversCharacterProficiencyType;
	religion: MythWeaversCharacterProficiencyType;
	society: MythWeaversCharacterProficiencyType;
	stealth: MythWeaversCharacterProficiencyType;
	survival: MythWeaversCharacterProficiencyType;
	thievery: MythWeaversCharacterProficiencyType;
};

type TMythWeaversCharacterSpecificProficiencies = {
	trained: string[];
	expert: string[];
	master: string[];
	legendary: string[];
};

type TMythWeaversCharacterSpellCaster = {
	/** "Cleric Font" | "Caster Arcane Sense" | "Wizard" | ... */
	name: string;

	/** "divine" | "arcane" | ... */
	magicTradition: TMythWeaversCharacterTraditionKey;

	/** "prepared" | "" */
	spellcastingType: string;

	/** "int" | "wis" | ... */
	ability: TMythWeaversCharacterAbilityKey;

	/** 0, 2, 4, 6, 8 */
	proficiency: MythWeaversCharacterProficiencyType;

	/** 0 */
	focusPoints: number;

	spells: TMythWeaversCharacterSpellCasterSpells[];

	perDay: number[];
};

type TMythWeaversCharacterSpellCasterSpells = {
	spellLevel: number;
	list: string[]; // "Heal"
};

type TMythWeaversCharacterTraditionKey = "arcane" | "divine" | "focus" | "occult" | "primal";

type TMythWeaversCharacterWeapon = {
	name: string;
	qty: number;
	/* proficiency: "martial" */
	prof: string;
	/* "d6" */
	die: string;
	/* potency: +1 */
	pot: number;
	/* Striking, Greater Striking, Major Striking */
	str: "striking" | "greater striking" | "major striking";
	/* material */
	mat: null;
	display: string;
	runes: string[];
};

type TMythWeaversCharacterFamiliar = {
	type: "Familiar";
	/** type === "Familiar" && specific === "Faerie Dragon"  >>  Faerie Dragon (name) */
	name: string;
	/** "Faerie Dragon" */
	specific: string;
	abilities: string[];
};

type TMythWeaversCharacterAnimalCompanion = {
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

type TMythWeaversCharacterPet = TMythWeaversCharacterFamiliar
	| TMythWeaversCharacterAnimalCompanion
	| { name:string; type:"Other"; };

export type TMythWeaversCharacterCustomFlags = {
	_proficiencyWithoutLevel?: boolean;
	_untrainedPenalty?: boolean;
};
type TMythWeaversCharacterCustomFlag = keyof TMythWeaversCharacterCustomFlags;
export type TMythWeaversCharacter = TMythWeaversCharacterCustomFlags & {
	/** Should be UUID */
	id: string;
	/** Clean this up! */
	sheet: TSimpleMap;
	name: string;
	class: string;
	dualClass?: string;
	level: number;
	ancestry: string;
	heritage: string;
	background: string;
	alignment: string;
	gender: string;
	age: string;
	deity: string;
	size: MythWeaversCharacterSizeType;
	keyability: TMythWeaversCharacterAbilityKey;
	languages: string[];
	attributes: TMythWeaversCharacterAttributes;
	abilities: TMythWeaversCharacterAbilities;
	proficiencies: TMythWeaversCharacterProficiencies;
	feats: TMythWeaversCharacterFeat[];
	specials: string[];
	lores: TMythWeaversCharacterLore[];
	equipment: TMythWeaversCharacterEquipment[];
	specificProficiencies: TMythWeaversCharacterSpecificProficiencies;
	weapons: TMythWeaversCharacterWeapon[];
	money: TMythWeaversCharacterMoney;
	armor: TMythWeaversCharacterArmor[];
	spellCasters: TMythWeaversCharacterSpellCaster[];
	formula: TMythWeaversCharacterFormula[];
	pets: TMythWeaversCharacterPet[];
	acTotal: TMythWeaversCharacterArmorClassTotal;
};

type TMythWeaversCharacterResponse = {
	success: boolean;
	build: TMythWeaversCharacter;
};

//#endregion

//#region helpers

function bracketTraits(...traits: string[]): string {
	const filtered = traits.filter(t => t && t.trim());
	return `[${filtered.join("] [")}]`;
}

function mapFeat(feat: TMythWeaversCharacterFeat): string {
	return feat[1] ? `${feat[0]} (${feat[1]})` : feat[0];
}

function toHtmlPerception(char: MythWeaversCharacter): string {
	const modifier = toModifier(char.perceptionMod);
	const specials = char.perceptionSpecials.length ? `; ${char.perceptionSpecials.map(s => s.toLowerCase()).join(", ")}` : ``;
	const incredibleInit = char.hasFeat("Incredible Initiative") ? `; incredible initiative (+2)` : ``;
	return `${modifier}${specials}${incredibleInit}`;
}

function abilitiesToHtml(char: MythWeaversCharacter): string {
	const core = char.toJSON();
	return (<TMythWeaversCharacterAbilityKey[]>["str", "dex", "con", "int", "wis", "cha"]).map(key => {
		const score = core.abilities[key], mod = Abilities.scoreToMod(score);
		return `<b>${utils.StringUtils.capitalize(key)}</b> ${toModifier(mod)}`;
	}).join(", ");
}
function itemsToHtml(weapons: TMythWeaversCharacterWeapon[], armors: TMythWeaversCharacterArmor[]): string {
	const weaponNames = weapons.map(weapon => weapon.display ?? weapon.name);
	const armorNames = armors.map(armor => armor.display ?? armor.name);
	return weaponNames.concat(armorNames).join(", ");
}
function equipmentToHtml(equipment: TMythWeaversCharacterEquipment[]): string {
	const NAME = 0, COUNT = 1;
	return equipment.map(o => o[COUNT] > 1 ? `${o[NAME]} x${o[COUNT]}` : o[NAME]).join(", ");
}
function loreToHtml(char: MythWeaversCharacter): string {
	const NAME = 0, PROFMOD = 1;
	return char.lores.map(l => {
		const profMod = l[PROFMOD];
		return `${l[NAME]} ${toModifier(char.getLevelMod(profMod) + profMod + char.abilities.intMod)}`;
	}).join(", ");
}
function moneyToHtml(money: TMythWeaversCharacterMoney): string {
	const coins = <string[]>[];
	if (money.pp) {
		coins.push(`${money.pp} pp`);
	}
	if (money.gp) {
		coins.push(`${money.gp} gp`);
	}
	if (money.sp) {
		coins.push(`${money.sp} sp`);
	}
	if (money.cp) {
		coins.push(`${money.cp} cp`);
	}
	return coins.join(", ");
}
function skillsToHtml(char: MythWeaversCharacter): string {
	return skillNames.map(skill => {
		const profMod = char.getProficiencyMod(skill as TMythWeaversCharacterProficienciesKey);
		if (profMod <= 0) {
			return "";
		}
		return `${skill} ${toModifier(char.getSkillMod(skill))}`;
	}).filter(s => s).join(", ");
}
function calculateSpeed(char: MythWeaversCharacter): number {
	const core = char.toJSON();
	const mod = core.attributes.speedBonus ?? 0;
	return mod + core.attributes.speed;
}


//#region spellCaster

function spellCasterToLabel(spellCaster: TMythWeaversCharacterSpellCaster): string {
	if (spellCaster.name.startsWith("Caster ")) {
		return spellCaster.name.slice("Caster ".length);
	}
	if (spellCaster.name === "Cleric Font") {
		return spellCaster.name;
	}
	if (spellCaster.name === "Other Spells (Staves etc)") {
		return spellCaster.name;
	}
	const tradition = utils.StringUtils.capitalize(spellCaster.magicTradition);
	const type = utils.StringUtils.capitalize(spellCaster.spellcastingType);
	return `${tradition} ${type} Spells`;
}

function spellsListToHtml(spells: string[]): string {
	const mapped = spells.reduce((map, spell) => {
		const lower = spell.toLowerCase();
		map.set(lower, (map.get(lower) ?? 0) + 1);
		return map;
	}, new Map<string, number>());
	const flattened = Array.from(mapped.entries()).map(([spell, count]) => {
		const name = `<i>${spell}</i>`;
		const times = count > 1 ? ` x${count}` : ``;
		return name + times;
	});
	return flattened.join(", ");
}

function spellCasterToHtml(char: MythWeaversCharacter, spellCaster: TMythWeaversCharacterSpellCaster): string {
	const label = spellCasterToLabel(spellCaster);
	const mod = char.getLevelMod(spellCaster.proficiency)
		+ char.abilities.getAbilityScoreModifier(ABILITIES.find(abil => abil.toLowerCase().startsWith(spellCaster.ability))!)
		+ spellCaster.proficiency;
	const isFocus = spellCaster.focusPoints > 0;
	const focusPoints = isFocus ? ` ${spellCaster.focusPoints} Focus Points;` : ``;
	const dcAttackLabel = spellCaster.name === "Caster Arcane Sense" ? `` : ` DC ${10+mod}, attack +${mod};`;
	const spellLevels = spellCaster.spells.map((spells, level, a) => {
		if (!isFocus && spellCaster.perDay[level] === 0) {
			return null;
		}
		const levelLabel = `<b>${spellCasterLevelToHtml(char, spellCaster, spells, isFocus ? Math.floor(char.level / 2) : a.length - 1)}</b>`;
		const slots = !isFocus && spellCaster.spellcastingType === "spontaneous" && level ? ` (${spellCaster.perDay[level]} slots)` : ``;
		const list = spellsListToHtml(spells.list);
		return `${levelLabel}${slots} ${list}`;
	}).filter(s => s).reverse();
	return `<b>${label}</b>${dcAttackLabel}${focusPoints} ${spellLevels.join("; ")}`;
}

function spellCasterLevelToHtml(char: MythWeaversCharacter, spellCaster: TMythWeaversCharacterSpellCaster, spells: TMythWeaversCharacterSpellCasterSpells, maxLevel: number): string {
	if (spellCaster.name === "Caster Arcane Sense") {
		const arcana = char.getProficiency("arcana");
		switch (arcana) {
			case "Legendary": return `Cantrip (4th)`;
			case "Master": return `Cantrip (3rd)`;
			default: return `Cantrip (1st)`;
		}
	}
	if (spells.spellLevel) {
		return utils.NumberUtils.nth(spells.spellLevel);
	}
	return `Cantrips (${utils.NumberUtils.nth(Math.max(maxLevel, 1))})`;
}

//#endregion

//#region pets

function getFamiliarName(pet: TMythWeaversCharacterFamiliar): string {
	return pet.name.includes(pet.specific) ? pet.name : `${pet.name} (${pet.specific})`;
}

function getAnimalCompanionName(pet: TMythWeaversCharacterAnimalCompanion): string {
	const animalParts: string[] = [];
	if (!pet.mature) {
		animalParts.push("Young");
	}
	if (pet.incredible) {
		animalParts.push(pet.incredibleType);
	}
	animalParts.push(pet.animal);
	const animal = animalParts.join(" ");

	if (pet.name.endsWith(` - ${animal}`)) {
		const name = pet.name.slice(0, -1 * (animal.length + 3));
		return `${name} (${animal})`;
	}
	if (pet.name.includes(animal)) {
		return pet.name;
	}
	if (pet.name.includes(pet.animal)) {
		return pet.name;
	}
	return `${pet.name} (${pet.animal})`;
}

function doPets(char: MythWeaversCharacter): string[] {
	return char.toJSON().pets.map(pet => {
		if (pet.type === "Familiar") {
			const name = getFamiliarName(pet);
			return `<b>${pet.type}</b> ${name}; ${pet.abilities.join(", ")}`;
		}else if (pet.type === "Animal Companion") {
			const name = getAnimalCompanionName(pet);
			const specializations = pet.specializations.length ? `; ${pet.specializations.join(", ")}` : ``;
			const armor = pet.armor ? `; ${pet.armor}` : ``;
			const equipment = pet.equipment.length ? `; ${equipmentToHtml(pet.equipment)}` : ``;
			return `<b>${pet.type}</b> ${name}${specializations}${armor}${equipment}`;
		}else {
			console.log(JSON.stringify(pet));
			return pet.name;
		}
	});
}

//#endregion

function doEquipmentMoney(char: MythWeaversCharacter) {
	const out = [];
	const core = char.toJSON();
	const hasEquipment = core.equipment.length > 0;
	const hasMoney = Object.keys(core.money).find(key => core.money[key as keyof TMythWeaversCharacterMoney]);
	if (hasEquipment || hasMoney) {
		if (hasEquipment) {
			out.push(`<b>Equipment</b> ${equipmentToHtml(core.equipment)}`);
		}
		if (hasMoney) {
			out.push(`<b>Coins</b> ${moneyToHtml(core.money)}`);
		}
	}
	return out;
}

//#region weapons

function weaponToAttackStatMod(weapon: Weapon, strMod: number, dexMod: number): number {
	if (weapon.type === "Ranged") {
		return dexMod;
	}else {
		// Melee | Unarmed
		if (weapon.traits.includes("Finesse")) {
			return Math.max(strMod, dexMod);
		}
		return strMod;
	}
}

function weaponToDamageStrMod(weapon: Weapon, strMod: number): number {
	if (weapon.type === "Ranged") {
		if (weapon.traits.includes("Propulsive")) {
			return strMod < 0 ? strMod : Math.floor(strMod / 2);
		}
		if (weapon.traits.includes("Thrown")) {
			return strMod;
		}
		return 0;
	}
	// Melee | Unarmed
	return strMod;
}

function strikingToDiceCount(text: string): number {
	const lower = text.toLowerCase();
	if (lower === "greater striking") {
		return 3;
	}else if (lower === "striking") {
		return 2;
	}
	return 1;
}

function weaponToDamage(char: MythWeaversCharacter, weapon: TMythWeaversCharacterWeapon, weaponItem: Weapon): string {
	const modNumber =
		weaponToDamageStrMod(weaponItem, char.abilities.strMod)
		+ getWeaponSpecMod(char, weapon);
	const modString = modNumber ? toModifier(modNumber) : "";
	return weaponItem.damage?.replace(/1d/, `${strikingToDiceCount(weapon.str)}d`)
		.replace(/d\d+/, match => `${match}${modString}`)
		?? "";
}

function findWeaponIn(value: string): OrUndefined<Weapon> {
	const lower = value?.toLowerCase();
	if (lower) {
		const matches = repoFilter("Weapon", wpn => lower.includes(wpn.nameLower));
		const maxLength = matches.reduce((length, wpn) => Math.max(length, wpn.name.length), 0);
		const longest = matches.filter(wpn => wpn.name.length === maxLength);
		if (longest.length === 1) {
			return longest[0];
		}
	}
	return undefined;
}

function findWeapon(weapon: TMythWeaversCharacterWeapon): OrUndefined<Weapon> {
	return repoFind("Weapon", weapon.name) ?? findWeaponIn(weapon.display) ?? findWeaponIn(weapon.name);
}

function getWeaponSpecMod(char: MythWeaversCharacter, weapon: TMythWeaversCharacterWeapon): number {
	if (char.hasSpecial("Weapon Specialization")) {
		const prof = char.getProficiency(weapon.prof as TMythWeaversCharacterProficienciesKey, weapon.name);
		switch(prof) {
			case "Expert": return 2;
			case "Master": return 3;
			case "Legendary": return 4;
		}
	}
	return 0;
}

function weaponToHtml(char: MythWeaversCharacter, weapon: TMythWeaversCharacterWeapon): string {
	const wpnItem = findWeapon(weapon);
	if (wpnItem) {
		const profMod = char.getProficiencyMod(weapon.prof as TMythWeaversCharacterProficienciesKey, weapon.name);
		const levelMod = char.getLevelMod(profMod);
		const mod = levelMod
			+ weaponToAttackStatMod(wpnItem, char.abilities.strMod, char.abilities.dexMod)
			+ char.getProficiencyMod(weapon.prof as TMythWeaversCharacterProficienciesKey, weapon.name)
			+ weapon.pot;
		const dmg = weaponToDamage(char, weapon, wpnItem);
		return `<b>${wpnItem.type}</b> ${weapon.display} ${toModifier(mod)} <b>Damage</b> ${dmg}`;
	}else {
		/** @todo Figure out if type is melee/ranged */
		const type = "Custom";
		const profMod = char.getProficiencyMod(weapon.prof as TMythWeaversCharacterProficienciesKey);
		const levelMod = char.getLevelMod(profMod);
		const mod = levelMod
			+ profMod
			+ weapon.pot;
		const dmg = `${strikingToDiceCount(weapon.str)}${weapon.die}`;
		return `<b>${type}</b> ${weapon.display} ${toModifier(mod)} <b>Damage</b> ${dmg}; <i>Dex/Str/Spec mods not included</i>`;
	}
}

function weaponToMacro(char: MythWeaversCharacter, weapon: TMythWeaversCharacterWeapon): TMacro {
	const wpnItem = findWeapon(weapon);
	if (wpnItem) {
		const profMod = char.getProficiencyMod(weapon.prof as TMythWeaversCharacterProficienciesKey, weapon.name);
		const levelMod = char.getLevelMod(profMod);
		const mod = levelMod
			+ weaponToAttackStatMod(wpnItem, char.abilities.strMod, char.abilities.dexMod)
			+ profMod
			+ weapon.pot;
		const dmg = weaponToDamage(char, weapon, wpnItem);
		return { name:weapon.display, dice:`[1d20${mod ? toModifier(mod) : ""} "${weapon.display}"; ${dmg}]` };
	}else {
		const profMod = char.getProficiencyMod(weapon.prof as TMythWeaversCharacterProficienciesKey);
		const levelMod = char.getLevelMod(profMod);
		const mod = levelMod
			+ profMod
			+ weapon.pot;
		const dmg = `${strikingToDiceCount(weapon.str)}${weapon.die}`;
		return { name:weapon.display, dice:`[1d20${mod ? toModifier(mod) : ""} "${weapon.display}"; ${dmg} <i>Dex/Str/Spec mods not included</i>]` };
	}
}

//#endregion

//#endregion

function eq<T, U>(a: T, b: U, matcher = false): boolean {
	if (matcher) {
		return utils.StringUtils.StringMatcher.matches(String(a), String(b));
	}
	return String(a).toLowerCase() === String(b).toLowerCase();
}

export type TCharacterSectionType = "All" | "Armor" | "Attacks" | "Equipment" | "Feats" | "Formulas" | "Languages" | "Perception" | "Pets" | "Skills" | "Speed" | "Spells" | "Stats" | "Traits" | "Weapons";
export const CharacterSectionTypes: TCharacterSectionType[] = ["All", "Armor", "Attacks", "Equipment", "Feats", "Formulas", "Languages", "Perception", "Pets", "Skills", "Speed", "Spells", "Stats", "Traits", "Weapons"];
export function getCharacterSections(view: Optional<TCharacterViewType>): TCharacterSectionType[] | null {
	switch(view) {
		case "All": return ["All"];
		case "Combat": return ["Traits", "Perception", "Languages", "Skills", "Weapons", "Armor", "Stats", "Speed", "Attacks"];
		case "Equipment": return ["Traits", "Perception", "Languages", "Skills", "Weapons", "Armor", "Equipment"];
		case "Feats": return ["Traits", "Perception", "Languages", "Skills", "Feats"];
		case "Formulas": return ["Traits", "Perception", "Languages", "Skills", "Formulas"];
		case "Pets": return ["Traits", "Perception", "Languages", "Skills", "Pets"];
		case "Spells": return ["Traits", "Perception", "Languages", "Skills", "Spells"];
	}
	return null;
}

export type TCharacterViewType = "All" | "Combat" | "Equipment" | "Feats" | "Formulas" | "Pets" | "Spells";
export const CharacterViewTypes: TCharacterViewType[] = ["All", "Combat", "Equipment", "Feats", "Formulas", "Pets", "Spells"];

type TSimpleMap = { [key:string]:any; };
export default class MythWeaversCharacter extends utils.ClassUtils.SuperClass implements IHasAbilities, IHasProficiencies, IHasSavingThrows {

	//#region interactive char sheet
	private get sheet(): TSimpleMap { return this.core.sheet ?? (this.core.sheet = {}); }
	public getSheetValue<T extends any = string>(key: string): T | undefined { return this.sheet[key]; }
	public setSheetValue<T>(key: string, value: T): void {
		if (value === undefined) {
			delete this.sheet[key];
		}else {
			this.sheet[key] = value;
		}
	}
	//#endregion

	public constructor(private core: TMythWeaversCharacter, flags: TMythWeaversCharacterCustomFlags = { }) {
		super();
		if (!core.id) {
			core.id = utils.UuidUtils.generate();
		}
		Object.keys(flags).forEach(key => {
			core[key as TMythWeaversCharacterCustomFlag] = flags[key as TMythWeaversCharacterCustomFlag];
		});
	}
	public toJSON(): TMythWeaversCharacter { return this.core; }

	public get id(): string { return this.core.id; }
	public get name(): string { return this.core.name; }
	public getAttackMacros(): TMacro[] { return this.core.weapons?.map(weapon => weaponToMacro(this, weapon)) ?? []; }

	//#region flags/has
	public hasFeat(value: string): boolean {
		return utils.StringUtils.StringMatcher.matchesAny(value, this.core.feats.map(feat => feat[0]));
	}
	public hasSpecial(value: string): boolean {
		return utils.StringUtils.StringMatcher.matchesAny(value, this.core.specials);
	}
	private _resilientBonus: number | undefined;
	public get resilientBonus(): number {
		if (this._resilientBonus === undefined) {
			if (this.core.armor.find(armor => eq(armor.res, "Major Resilient"))) {
				this._resilientBonus = 3;
			}else if (this.core.armor.find(armor => eq(armor.res, "Greater Resilient"))) {
				this._resilientBonus = 2;
			}else if (this.core.armor.find(armor => eq(armor.res, "Resilient"))) {
				this._resilientBonus = 1;
			}else {
				this._resilientBonus = 0;
			}
		}
		return this._resilientBonus;
	}
	//#endregion

	/** Implements IHasAbilities */
	public abilities = Abilities.for(this);
	public feats = utils.ArrayUtils.Collection.from(this.core.feats ?? []);
	public savingThrows = SavingThrows.for(this);

	public get level(): number {
		return this.core.level;
	}

	private get untrainedProficiencyMod(): number {
		return this.core._untrainedPenalty === true ? -1 : 0;
	}
	public getLevelMod(profMod: number): number;
	public getLevelMod(trained: boolean): number;
	public getLevelMod(arg: boolean | number): number {
		const trained = typeof(arg) === "boolean" ? arg : arg > 0;
		if (trained) {
			return this.core._proficiencyWithoutLevel === true ? 0 : this.level;
		}
		return this.untrainedProficiencyMod;
	}

	//#region IHasProficiencies

	public getProficiency(key: TMythWeaversCharacterProficienciesKey, specificKey?: string): TProficiency {
		const profMod = this.getProficiencyMod(key, specificKey);
		return profMod === -2
			? "Untrained"
			: <TProficiency>MythWeaversCharacterProficiencyType[profMod];
	}

	public getProficiencyMod(key: TMythWeaversCharacterProficienciesKey, specificKey?: string): MythWeaversCharacterProficiencyType {
		const keys = Object.keys(this.core.proficiencies) as TMythWeaversCharacterProficienciesKey[];
		const lower = key.toLowerCase();
		const found = keys.find(k => k.toLowerCase() === lower);
		const keyMod = found ? this.core.proficiencies[found] ?? 0 : 0;
		const specificMod = specificKey ? this.getSpecificProficiencyMod(specificKey) : 0;
		const profMod = Math.max(keyMod, specificMod);
		return profMod === 0 && this.core._untrainedPenalty === true ? -2 : profMod;
	}
	private getSpecificProficiencyMod(key: string): MythWeaversCharacterProficiencyType {
		if (this.core?.specificProficiencies?.legendary?.includes(key)) {
			return MythWeaversCharacterProficiencyType.Legendary;
		}
		if (this.core?.specificProficiencies?.master?.includes(key)) {
			return MythWeaversCharacterProficiencyType.Master;
		}
		if (this.core?.specificProficiencies?.expert?.includes(key)) {
			return MythWeaversCharacterProficiencyType.Expert;
		}
		if (this.core?.specificProficiencies?.trained?.includes(key)) {
			return MythWeaversCharacterProficiencyType.Trained;
		}
		return MythWeaversCharacterProficiencyType.Untrained;
	}

	//#endregion

	public get lores(): TMythWeaversCharacterLore[] {
		return this.core.lores ?? [];
	}
	public hasLore(loreName: string): boolean { return this.getLore(loreName) !== undefined; }
	private getLore(loreName: string): TMythWeaversCharacterLore | undefined { return this.lores.find(lore => lore[0] === loreName); }
	public getLoreMod(loreName: string): number {
		const lore = this.getLore(loreName);
		const loreMod = lore?.[1] ?? 0;
		const levelMod = this.getLevelMod(loreMod);
		return levelMod + loreMod + this.abilities.intMod;
	}

	public getSkillMod(skillName: string): number {
		const skillIndex = skillNames.indexOf(skillName);
		const profMod = this.getProficiencyMod(skillName as TMythWeaversCharacterProficienciesKey);
		const levelMod = this.getLevelMod(profMod);
		const statMod = Abilities.scoreToMod(this.abilities[skillStatKeys[skillIndex]]);
		return levelMod + profMod + statMod;
	}

	public getProficiencyAndMod(key: string): [TProficiency, number] {
		if (key === "Perception") {
			return [this.getProficiency(key as TMythWeaversCharacterProficienciesKey), this.perceptionMod];
		}
		if (skillNames.includes(key)) {
			return [this.getProficiency(key as TMythWeaversCharacterProficienciesKey), this.getSkillMod(key)];
		}
		if (this.hasLore(key)) {
			const lore = this.getLore(key)!;
			return [MythWeaversCharacterProficiencyType[lore[1]] as TProficiency, this.getLoreMod(key)];
		}
		if (saveNames.includes(key)) {
			const ability = SavingThrows.getAbilityForSavingThrow(key as TSavingThrow);
			const check = this.savingThrows.getSavingThrow(key as TSavingThrow, ability ?? "Constitution");
			return [this.getProficiency(key as TMythWeaversCharacterProficienciesKey), check.modifier];
		}
		// Check other stuff?
		return ["Untrained", this.untrainedProficiencyMod];
	}

	public get perceptionMod(): number {
		const profMod = this.getProficiencyMod("perception");
		const levelMod = this.getLevelMod(profMod);
		return levelMod + profMod + this.abilities.wisMod;
	}
	public get perceptionSpecials(): string[] {
		return this.core.specials
			.filter((s, _, a) =>
			(s === "Low-Light Vision" && !a.includes("Darkvision"))
			|| s === "Darkvision"
			|| s.startsWith("Scent")
			|| s.startsWith("Echolocation")
			|| s.startsWith("Tremorsense")
			);
	}
	public get maxHp(): number {
		const attributes = this.core.attributes;
		return attributes.ancestryhp + attributes.bonushp
			+ (attributes.classhp + attributes.bonushpPerLevel + this.abilities.conMod) * this.level;
	}

	//#region toHtml

	private toHtmlName(): string {
		const name = this.core.name;
		const klass = this.core.class;
		const dualClass = this.core.dualClass ? `/${this.core.dualClass}` : ``;
		const level = this.level;
		return `${name} - ${klass}${dualClass} ${level}`;
	}

	public toHtml(outputTypes: TCharacterSectionType[] = ["All"]): string {
		const html: string[] = [];

		push(`<b><u>${this.toHtmlName()}</u></b>`);

		if (includes(["All", "Traits"])) {
			push(`${bracketTraits(this.core.alignment, MythWeaversCharacterSizeType[this.core.size], this.core.ancestry, this.core.heritage)}`);
		}

		if (includes(["All", "Perception"])) {
			push(`<b>Perception</b> ${toHtmlPerception(this)}`);
		}

		if (includes(["All", "Languages"]) && this.core.languages.length) {
			push(`<b>Languages</b> ${this.core.languages.join(", ")}`);
		}

		if (includes(["All", "Skills"])) {
			push(`<b>Skills</b> ${skillsToHtml(this)}; <b>Lore</b> ${loreToHtml(this)}; <i>mods from gear excluded</i>`);
		}

		const weapons = includes(["All", "Weapons"]) && this.core.weapons.length;
		const armor = includes(["All", "Armor"]) && this.core.armor.length;
		if (weapons || armor) {
			push(`<b>Items</b> ${itemsToHtml(weapons ? this.core.weapons : [], armor ? this.core.armor : [])}`);
		}

		if (includes(["All", "Stats"]) && this.core.weapons.length) {
			push();
			push(`${abilitiesToHtml(this)}`);
			push(`<b>AC</b> ${this.core.acTotal.acTotal}; ${this.savingThrows.toHtml()}`);
			push(`<b>HP</b> ${this.maxHp}`);
		}

		if (includes(["All", "Speed"]) && this.core.weapons.length) {
			push();
			push(`<b>Speed</b> ${calculateSpeed(this)} feet`);
		}

		if (includes(["All", "Attacks"]) && this.core.weapons.length) {
			push();
			this.core.weapons.map(weapon => weaponToHtml(this, weapon)).forEach(push);
		}

		if (includes(["All", "Spells"]) && this.core.spellCasters?.length) {
			push();
			this.core.spellCasters.map(spellCaster => spellCasterToHtml(this, spellCaster)).forEach(push);
		}

		if (includes(["All", "Pets"]) && this.core.pets?.length) {
			push();
			doPets(this).forEach(push);
		}

		if (includes(["All", "Equipment"])) {
			const lines = doEquipmentMoney(this);
			if (lines.length) {
				push();
				lines.forEach(push);
			}
		}

		if (includes(["All", "Feats"]) && this.feats.length) {
			push();
			push(`<b>Feats</b> ${this.feats.map(mapFeat).join(", ")}`);
		}

		//#region formulas
		if (includes(["All", "Formulas"]) && this.core.formula?.length) {
			push();
			const one = this.core.formula.length === 1;
			this.core.formula.forEach(formulaType => {
				const type = formulaType.type !== "other" || one ? ` (${formulaType.type})` : ``;
				push(`<b>Formula Book${type}</b> ${formulaType.known.join(", ")}`);
			});
		}
		//#endregion

		return html.join("");

		function includes(types: TCharacterSectionType[]): boolean {
			return types.find(type => outputTypes.includes(type)) !== undefined;
		}
		function push(value?: string) {
			if (value || html.length > 1) {
				html.push(`${html.length ? "<br/>" : ""}${value ?? "---"}`);
			}
		}
	}
	public getValidSectionsTypes(): TCharacterSectionType[] {
		const outputTypes: TCharacterSectionType[] = [
			"Traits",
			"Perception"
		];

		if (this.core.languages.length) {
			outputTypes.push("Languages");
		}

		outputTypes.push("Skills");

		if (this.core.weapons.length) {
			outputTypes.push("Weapons");
		}

		if (this.core.armor.length) {
			outputTypes.push("Armor");
		}

		outputTypes.push("Stats", "Speed");

		if (this.core.weapons.length) {
			outputTypes.push("Attacks");
		}

		if (this.core.spellCasters.length) {
			outputTypes.push("Spells");
		}

		if (this.core.pets.length) {
			outputTypes.push("Pets");
		}

		//#region Equipment
		const hasEquipment = this.core.equipment.length > 0;
		const hasMoney = Object.keys(this.core.money).find(key => this.core.money[key as keyof TMythWeaversCharacterMoney]);
		if (hasEquipment || hasMoney) {
			outputTypes.push("Equipment");
		}
		//#endregion

		if (this.core.feats.length) {
			outputTypes.push("Feats");
		}

		if (this.core.formula.length) {
			outputTypes.push("Formulas");
		}

		return outputTypes;
	}
	public getValidViewTypes(): TCharacterViewType[] {
		const outputTypes: TCharacterViewType[] = [];

		if (this.core.weapons?.length) {
			outputTypes.push("Combat");
		}

		//#region Equipment
		const hasEquipment = this.core.equipment.length > 0;
		const hasMoney = Object.keys(this.core.money).find(key => this.core.money[key as keyof TMythWeaversCharacterMoney]);
		if (hasEquipment || hasMoney) {
			outputTypes.push("Equipment");
		}
		//#endregion

		if (this.core.feats?.length) {
			outputTypes.push("Feats");
		}

		if (this.core.formula?.length) {
			outputTypes.push("Formulas");
		}

		if (this.core.pets?.length) {
			outputTypes.push("Pets");
		}

		if (this.core.spellCasters?.length) {
			outputTypes.push("Spells");
		}

		return outputTypes;
	}

	//#endregion

	//#region fetch

	public static fetch(id: number, flags?: TMythWeaversCharacterCustomFlags): Promise<MythWeaversCharacter | null> {
		return this.fetchCore(id)
			.then(core => new MythWeaversCharacter(core, flags), () => null);
	}

	public static fetchCore(id: number): Promise<TMythWeaversCharacter> {
		return new Promise<TMythWeaversCharacter>(async (resolve, reject) => {
			try {
				// irktik = 2591611
				const url = `https://www.myth-weavers.com/api/v1/sheets/sheets/${id}`;
				const json = await utils.HttpsUtils.getJson<TMythWeaversCharacterResponse>(url).catch(reject);
// utils.FsUtils.writeFileSync(`mythweavers-${id}.json`, json);
				if (json?.success) {
					resolve(json.build);
				}else {
					reject(JSON.stringify(json));
				}
			} catch (ex) {
				reject(ex);
			}
		});
	}

	//#endregion
}
