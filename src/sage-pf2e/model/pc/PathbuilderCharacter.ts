import { Collection } from "@rsc-utils/array-utils";
import { CharacterBase, type CharacterBaseCore } from "@rsc-utils/character-utils";
import { debug, errorReturnFalse, errorReturnNull, getDataRoot, stringify, type Optional, type OrUndefined } from "@rsc-utils/core-utils";
import { randomSnowflake } from "@rsc-utils/dice-utils";
import { fileExistsSync, getJson, readJsonFile, readJsonFileSync, writeFile } from "@rsc-utils/io-utils";
import { nth } from "@rsc-utils/number-utils";
import { StringMatcher, capitalize } from "@rsc-utils/string-utils";
import type { TMacro } from "../../../sage-lib/sage/model/types.js";
import type { GetStatPrefix, TProficiency, TSavingThrow } from "../../common.js";
import { getSavingThrows, toModifier } from "../../common.js";
import { filter as repoFilter, findByValue as repoFind } from "../../data/Repository.js";
import { ABILITIES } from "../../index.js";
import type { Weapon } from "../Weapon.js";
import { Abilities, type IHasAbilities } from "./Abilities.js";
import type { IHasProficiencies } from "./PlayerCharacter.js";
import { SavingThrows, type IHasSavingThrows } from "./SavingThrows.js";

const skillNames = "Acrobatics,Arcana,Athletics,Crafting,Deception,Diplomacy,Intimidation,Medicine,Nature,Occultism,Performance,Religion,Society,Stealth,Survival,Thievery".split(",");
const skillStatKeys: TPathbuilderCharacterAbilityKey[] = ["dex", "int", "str", "int", "cha", "cha", "cha", "wis", "wis", "int", "cha", "wis", "int", "dex", "wis", "dex"];

//#region types

enum PathbuilderCharacterProficiencyType {
	PenalizedUntrained = -2,
	Untrained = 0,
	Trained = 2,
	Expert = 4,
	Master = 6,
	Legendary = 8
}

enum PathbuilderCharacterSizeType {
	Tiny = 0,
	Small = 1,
	Medium = 2,
	Large = 3,
	Huge = 4
}

export type TPathbuilderCharacterAbilityKey = keyof TPathbuilderCharacterAbilities;

type TPathbuilderCharacterAbilities = {
	str: number;
	dex: number;
	con: number;
	int: number;
	wis: number;
	cha: number;
};

type TPathbuilderCharacterArmorClassTotal = {
	acProfBonus: number;
	acAbilityBonus: number;
	acItemBonus: number;
	acTotal: number;
};

type TPathbuilderCharacterArmor = {
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
	ancestryhp: number;
	classhp: number;
	bonushp: number;
	bonushpPerLevel: number;
	speed: number;
	speedBonus: number;
};

/** [ [name, null, type, level] ] */
type TPathbuilderCharacterFeat = [string, null, string, number];

/** [ [name, profMod] ] */
type TPathbuilderCharacterLore = [string, number];

/** [ [name, count] ] */
type TPathbuilderCharacterEquipment = [string, number];

type TPathbuilderCharacterFormula = {
	/** "other" */
	type: string;
	known: string[];
};

type TPathbuilderCharacterMoney = {
	pp: number;
	gp: number;
	sp: number;
	cp: number;
};

type TPathbuilderCharacterProficienciesKey = keyof TPathbuilderCharacterProficiencies;
type TPathbuilderCharacterProficiencies = {
	classDC: PathbuilderCharacterProficiencyType;
	perception: PathbuilderCharacterProficiencyType;
	fortitude: PathbuilderCharacterProficiencyType;
	reflex: PathbuilderCharacterProficiencyType;
	will: PathbuilderCharacterProficiencyType;
	heavy: PathbuilderCharacterProficiencyType;
	medium: PathbuilderCharacterProficiencyType;
	light: PathbuilderCharacterProficiencyType;
	unarmored: PathbuilderCharacterProficiencyType;
	advanced: PathbuilderCharacterProficiencyType;
	martial: PathbuilderCharacterProficiencyType;
	simple: PathbuilderCharacterProficiencyType;
	unarmed: PathbuilderCharacterProficiencyType;
	castingArcane: PathbuilderCharacterProficiencyType;
	castingDivine: PathbuilderCharacterProficiencyType;
	castingOccult: PathbuilderCharacterProficiencyType;
	castingPrimal: PathbuilderCharacterProficiencyType;
	acrobatics: PathbuilderCharacterProficiencyType;
	arcana: PathbuilderCharacterProficiencyType;
	athletics: PathbuilderCharacterProficiencyType;
	crafting: PathbuilderCharacterProficiencyType;
	deception: PathbuilderCharacterProficiencyType;
	diplomacy: PathbuilderCharacterProficiencyType;
	intimidation: PathbuilderCharacterProficiencyType;
	medicine: PathbuilderCharacterProficiencyType;
	nature: PathbuilderCharacterProficiencyType;
	occultism: PathbuilderCharacterProficiencyType;
	performance: PathbuilderCharacterProficiencyType;
	religion: PathbuilderCharacterProficiencyType;
	society: PathbuilderCharacterProficiencyType;
	stealth: PathbuilderCharacterProficiencyType;
	survival: PathbuilderCharacterProficiencyType;
	thievery: PathbuilderCharacterProficiencyType;
};

type TPathbuilderCharacterSpecificProficiencies = {
	trained: string[];
	expert: string[];
	master: string[];
	legendary: string[];
};

type TPathbuilderCharacterSpellCaster = {
	/** "Cleric Font" | "Caster Arcane Sense" | "Wizard" | ... */
	name: string;

	/** "divine" | "arcane" | ... */
	magicTradition: TPathbuilderCharacterTraditionKey;

	/** "prepared" | "" */
	spellcastingType: string;

	/** "int" | "wis" | ... */
	ability: TPathbuilderCharacterAbilityKey;

	/** 0, 2, 4, 6, 8 */
	proficiency: PathbuilderCharacterProficiencyType;

	/** 0 */
	focusPoints: number;

	spells: TPathbuilderCharacterSpellCasterSpells[];

	perDay: number[];
};

type TPathbuilderCharacterSpellCasterSpells = {
	spellLevel: number;
	list: string[]; // "Heal"
};

type TPathbuilderCharacterTraditionKey = "arcane" | "divine" | "focus" | "occult" | "primal";

type TPathbuilderCharacterWeapon = {
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

type TPathbuilderCharacterFamiliar = {
	type: "Familiar";
	/** type === "Familiar" && specific === "Faerie Dragon"  >>  Faerie Dragon (name) */
	name: string;
	/** "Faerie Dragon" */
	specific: string;
	abilities: string[];
};

type TPathbuilderCharacterAnimalCompanion = {
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
type TPathbuilderCharacterCustomFlag = keyof TPathbuilderCharacterCustomFlags;
export type TPathbuilderCharacter = CharacterBaseCore<"PathbuilderCharacter"> & TPathbuilderCharacterCustomFlags & {
	/** Clean this up! */
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
	size: PathbuilderCharacterSizeType;
	keyability: TPathbuilderCharacterAbilityKey;
	languages: string[];
	attributes: TPathbuilderCharacterAttributes;
	abilities: TPathbuilderCharacterAbilities;
	proficiencies: TPathbuilderCharacterProficiencies;
	feats: TPathbuilderCharacterFeat[];
	specials: string[];
	lores: TPathbuilderCharacterLore[];
	equipment: TPathbuilderCharacterEquipment[];
	specificProficiencies: TPathbuilderCharacterSpecificProficiencies;
	weapons: TPathbuilderCharacterWeapon[];
	money: TPathbuilderCharacterMoney;
	armor: TPathbuilderCharacterArmor[];
	spellCasters: TPathbuilderCharacterSpellCaster[];
	formula: TPathbuilderCharacterFormula[];
	pets: TPathbuilderCharacterPet[];
	acTotal: TPathbuilderCharacterArmorClassTotal;
	exportJsonId: number;
};

type TPathbuilderCharacterResponse = {
	success: boolean;
	build: TPathbuilderCharacter;
};

//#endregion

//#region helpers

function bracketTraits(...traits: string[]): string {
	const filtered = traits.filter(t => t && t.trim());
	return `[${filtered.join("] [")}]`;
}

function mapFeat(feat: TPathbuilderCharacterFeat): string {
	return feat[1] ? `${feat[0]} (${feat[1]})` : feat[0];
}

function toHtmlPerception(char: PathbuilderCharacter): string {
	const modifier = toModifier(char.perceptionMod);
	const specials = char.perceptionSpecials.length ? `; ${char.perceptionSpecials.map(s => s.toLowerCase()).join(", ")}` : ``;
	const incredibleInit = char.hasFeat("Incredible Initiative") ? `; incredible initiative (+2)` : ``;
	return `${modifier}${specials}${incredibleInit}`;
}

function abilitiesToHtml(char: PathbuilderCharacter): string {
	const core = char.toJSON();
	return (<TPathbuilderCharacterAbilityKey[]>["str", "dex", "con", "int", "wis", "cha"]).map(key => {
		const score = core.abilities[key], mod = Abilities.scoreToMod(score);
		return `<b>${capitalize(key)}</b> ${toModifier(mod)}`;
	}).join(", ");
}
function itemsToHtml(weapons: TPathbuilderCharacterWeapon[], armors: TPathbuilderCharacterArmor[]): string {
	const weaponNames = weapons.map(weapon => weapon.display ?? weapon.name);
	const armorNames = armors.map(armor => armor.display ?? armor.name);
	return weaponNames.concat(armorNames).join(", ");
}
function equipmentToHtml(equipment: TPathbuilderCharacterEquipment[]): string {
	const NAME = 0, COUNT = 1;
	return equipment.map(o => o[COUNT] > 1 ? `${o[NAME]} x${o[COUNT]}` : o[NAME]).join(", ");
}
function loreToHtml(char: PathbuilderCharacter): string {
	const NAME = 0, PROFMOD = 1;
	return char.lores.map(l => {
		const profMod = l[PROFMOD];
		return `${l[NAME]} ${toModifier(char.getLevelMod(profMod) + profMod + char.abilities.intMod)}`;
	}).join(", ");
}
function moneyToHtml(money: TPathbuilderCharacterMoney): string {
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
function skillsToHtml(char: PathbuilderCharacter): string {
	return skillNames.map(skill => {
		const profMod = char.getProficiencyMod(skill as TPathbuilderCharacterProficienciesKey);
		if (profMod <= 0) {
			return "";
		}
		return `${skill} ${toModifier(char.getSkillMod(skill))}`;
	}).filter(s => s).join(", ");
}
function calculateSpeed(char: PathbuilderCharacter): number {
	const core = char.toJSON();
	const mod = core.attributes.speedBonus ?? 0;
	return mod + core.attributes.speed;
}


//#region spellCaster

function spellCasterToLabel(spellCaster: TPathbuilderCharacterSpellCaster): string {
	if (spellCaster.name.startsWith("Caster ")) {
		return spellCaster.name.slice("Caster ".length);
	}
	if (spellCaster.name === "Cleric Font") {
		return spellCaster.name;
	}
	if (spellCaster.name === "Other Spells (Staves etc)") {
		return spellCaster.name;
	}
	const tradition = capitalize(spellCaster.magicTradition);
	const type = capitalize(spellCaster.spellcastingType);
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

function spellCasterToHtml(char: PathbuilderCharacter, spellCaster: TPathbuilderCharacterSpellCaster): string {
	const label = spellCasterToLabel(spellCaster);
	const mod = char.getLevelMod(spellCaster.proficiency)
		+ char.abilities.getAbilityScoreModifier(ABILITIES.find(abil => abil.toLowerCase().startsWith(spellCaster.ability))!)
		+ spellCaster.proficiency;
	const isFocus = spellCaster.focusPoints > 0;
	const focusPoints = isFocus ? ` ${spellCaster.focusPoints} Focus Points;` : ``;
	const dcAttackLabel = spellCaster.name === "Caster Arcane Sense" ? `` : ` DC ${10+mod}, attack +${mod};`;
	const spellLevels = spellCaster.spells.map((spells, level) => {
		if (!isFocus && spellCaster.perDay[level] === 0) {
			return null;
		}
		const levelLabel = `<b>${spellCasterLevelToHtml(char, spellCaster, spells, Math.ceil(char.level / 2))}</b>`;
		const slots = !isFocus && spellCaster.spellcastingType === "spontaneous" && level ? ` (${spellCaster.perDay[level]} slots)` : ``;
		const list = spellsListToHtml(spells.list);
		return `${levelLabel}${slots} ${list}`;
	}).filter(s => s).reverse();
	return `<b>${label}</b>${dcAttackLabel}${focusPoints} ${spellLevels.join("; ")}`;
}

function spellCasterLevelToHtml(char: PathbuilderCharacter, spellCaster: TPathbuilderCharacterSpellCaster, spells: TPathbuilderCharacterSpellCasterSpells, cantripLevel: number): string {
	if (spellCaster.name === "Caster Arcane Sense") {
		const arcana = char.getProficiency("arcana");
		switch (arcana) {
			case "Legendary": return `Cantrip (4th)`;
			case "Master": return `Cantrip (3rd)`;
			default: return `Cantrip (1st)`;
		}
	}
	if (spells.spellLevel) {
		return nth(spells.spellLevel);
	}
	return `Cantrips (${nth(Math.max(cantripLevel, 1))})`;
}

//#endregion

//#region pets

function getFamiliarName(pet: TPathbuilderCharacterFamiliar): string {
	return pet.name.includes(pet.specific) ? pet.name : `${pet.name} (${pet.specific})`;
}

function getAnimalCompanionName(pet: TPathbuilderCharacterAnimalCompanion): string {
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

function doPets(char: PathbuilderCharacter): string[] {
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
			debug(stringify(pet));
			return pet.name;
		}
	});
}

//#endregion

function doEquipmentMoney(char: PathbuilderCharacter) {
	const out = [];
	const core = char.toJSON();
	const hasEquipment = core.equipment.length > 0;
	const hasMoney = Object.keys(core.money).find(key => core.money[key as keyof TPathbuilderCharacterMoney]);
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

function weaponToDamage(char: PathbuilderCharacter, weapon: TPathbuilderCharacterWeapon, weaponItem: Weapon): string {
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

function findWeapon(weapon: TPathbuilderCharacterWeapon): OrUndefined<Weapon> {
	return repoFind("Weapon", weapon.name) ?? findWeaponIn(weapon.display) ?? findWeaponIn(weapon.name);
}

function getWeaponSpecMod(char: PathbuilderCharacter, weapon: TPathbuilderCharacterWeapon): number {
	if (char.hasSpecial("Weapon Specialization")) {
		const prof = char.getProficiency(weapon.prof as TPathbuilderCharacterProficienciesKey, weapon.name);
		switch(prof) {
			case "Expert": return 2;
			case "Master": return 3;
			case "Legendary": return 4;
		}
	}
	return 0;
}

function weaponToHtml(char: PathbuilderCharacter, weapon: TPathbuilderCharacterWeapon): string {
	const wpnItem = findWeapon(weapon);
	if (wpnItem) {
		const profMod = char.getProficiencyMod(weapon.prof as TPathbuilderCharacterProficienciesKey, weapon.name);
		const levelMod = char.getLevelMod(profMod);
		const mod = levelMod
			+ weaponToAttackStatMod(wpnItem, char.abilities.strMod, char.abilities.dexMod)
			+ char.getProficiencyMod(weapon.prof as TPathbuilderCharacterProficienciesKey, weapon.name)
			+ weapon.pot;
		const dmg = weaponToDamage(char, weapon, wpnItem);
		return `<b>${wpnItem.type}</b> ${weapon.display} ${toModifier(mod)} <b>Damage</b> ${dmg}`;
	}else {
		/** @todo Figure out if type is melee/ranged */
		const type = "Custom";
		const profMod = char.getProficiencyMod(weapon.prof as TPathbuilderCharacterProficienciesKey);
		const levelMod = char.getLevelMod(profMod);
		const mod = levelMod
			+ profMod
			+ weapon.pot;
		const dmg = `${strikingToDiceCount(weapon.str)}${weapon.die}`;
		return `<b>${type}</b> ${weapon.display} ${toModifier(mod)} <b>Damage</b> ${dmg}; <i>Dex/Str/Spec mods not included</i>`;
	}
}

function weaponToMacro(char: PathbuilderCharacter, weapon: TPathbuilderCharacterWeapon): TMacro {
	const wpnItem = findWeapon(weapon);
	if (wpnItem) {
		const profMod = char.getProficiencyMod(weapon.prof as TPathbuilderCharacterProficienciesKey, weapon.name);
		const levelMod = char.getLevelMod(profMod);
		const mod = levelMod
			+ weaponToAttackStatMod(wpnItem, char.abilities.strMod, char.abilities.dexMod)
			+ profMod
			+ weapon.pot;
		const dmg = weaponToDamage(char, weapon, wpnItem);
		return { name:weapon.display, dice:`[1d20${mod ? toModifier(mod) : ""} "${weapon.display}"; ${dmg}]` };
	}else {
		const profMod = char.getProficiencyMod(weapon.prof as TPathbuilderCharacterProficienciesKey);
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
		return StringMatcher.matches(String(a), String(b));
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

function perceptionGetStat(char: PathbuilderCharacter, prefix: GetStatPrefix): number | string | null {
	switch(prefix) {
		case "dc": return char.perceptionMod + 10;
		case "mod": return char.perceptionMod;
		case "prof": return char.getProficiencyMod("perception");
		case "proficiency": return char.getProficiency("perception");
		default: return char.perceptionMod;
	}
}
function skillGetStat(char: PathbuilderCharacter, statLower: string, prefix: GetStatPrefix): number | string | null {
	const skill = skillNames.find(name => statLower === name.toLowerCase());
	if (skill) {
		switch(prefix) {
			case "dc": return char.getSkillMod(skill) + 10;
			case "mod": return char.getSkillMod(skill);
			case "prof": return char.getProficiencyMod(skill as TPathbuilderCharacterProficienciesKey);
			case "proficiency": return char.getProficiency(skill as TPathbuilderCharacterProficienciesKey);
			default: return char.getSkillMod(skill);
		}
	}
	return null;
}
function loreGetStat(char: PathbuilderCharacter, statLower: string, prefix: GetStatPrefix): number | string | null {
	const lore = char.lores.find(([name]) => statLower === name.toLowerCase());
	if (lore) {
		switch(prefix) {
			case "dc": return char.getLoreMod(lore[0]) + 10;
			case "mod": return char.getLoreMod(lore[0]);
			case "prof": return lore[1];
			case "proficiency": return PathbuilderCharacterProficiencyType[lore[1]];
			default: return char.getLoreMod(lore[0]);
		}
	}
	return null;
}

export class PathbuilderCharacter extends CharacterBase<TPathbuilderCharacter> implements IHasAbilities, IHasProficiencies, IHasSavingThrows {
	public get exportJsonId(): number | undefined { return this.core.exportJsonId; }

	public getStat(stat: string): number | string | null {
		const lower = stat.toLowerCase();
		const [prefix, statLower] = lower.includes(".") ? lower.split(".") as [GetStatPrefix, string] : ["", lower] as [GetStatPrefix, string];

		switch(statLower) {
			case "activeexploration": return this.getSheetValue("activeExploration") ?? null;
			case "initskill": return this.getInitSkill();
			case "level": return this.level;
			case "maxhp": return this.maxHp;
			case "ac": return prefix === "prof" ? this.core.acTotal.acProfBonus : this.core.acTotal.acTotal;
			case "perception": case "perc": return perceptionGetStat(this, prefix);
			default: return skillGetStat(this, statLower, prefix)
				?? loreGetStat(this, statLower, prefix)
				?? this.savingThrows.getStat(statLower, prefix)
				?? this.abilities.getStat(statLower, prefix);
		}
	}

	public getInitSkill(): string {
		const activeExploration = this.getSheetValue("activeExploration");
		switch(activeExploration) {
			case "Avoid Notice": return "Stealth";
			case "Other": return this.getSheetValue("activeSkill") ?? "Perception";
			default: return "Perception";
		}
	}

	public constructor(core: TPathbuilderCharacter, flags: TPathbuilderCharacterCustomFlags = { }) {
		super(core);
		if (!core.id) {
			core.id = randomSnowflake();
		}
		Object.keys(flags).forEach(key => {
			core[key as TPathbuilderCharacterCustomFlag] = flags[key as TPathbuilderCharacterCustomFlag];
		});

		this.abilities = Abilities.for(this);
		this.feats = Collection.from(this.core.feats ?? []);
		this.savingThrows = SavingThrows.for(this);
	}

	public getAttackMacros(): TMacro[] { return this.core.weapons?.map(weapon => weaponToMacro(this, weapon)) ?? []; }

	//#region flags/has
	public hasFeat(value: string): boolean {
		return StringMatcher.matchesAny(value, this.core.feats.map(feat => feat[0]));
	}
	public hasSpecial(value: string): boolean {
		return StringMatcher.matchesAny(value, this.core.specials);
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
	public abilities: Abilities;
	public feats: Collection<TPathbuilderCharacterFeat>;
	public savingThrows: SavingThrows;

	public get level(): number {
		return this.core.level;
	}
	public async setLevel(level: number, save: boolean): Promise<boolean> {
		if (level > 0 && level < 21) {
			this.core.level = level;
			if (save) {
				return this.save();
			}
			return true;
		}
		return false;
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

	public getProficiency(key: TPathbuilderCharacterProficienciesKey, specificKey?: string): TProficiency {
		const profMod = this.getProficiencyMod(key, specificKey);
		return profMod === -2
			? "Untrained"
			: <TProficiency>PathbuilderCharacterProficiencyType[profMod];
	}

	public getProficiencyMod(key: TPathbuilderCharacterProficienciesKey, specificKey?: string): PathbuilderCharacterProficiencyType {
		const keys = Object.keys(this.core.proficiencies) as TPathbuilderCharacterProficienciesKey[];
		const lower = key.toLowerCase();
		const found = keys.find(k => k.toLowerCase() === lower);
		const keyMod = found ? this.core.proficiencies[found] ?? 0 : 0;
		const specificMod = specificKey ? this.getSpecificProficiencyMod(specificKey) : 0;
		const profMod = Math.max(keyMod, specificMod);
		return profMod === 0 && this.core._untrainedPenalty === true ? -2 : profMod;
	}
	private getSpecificProficiencyMod(key: string): PathbuilderCharacterProficiencyType {
		if (this.core?.specificProficiencies?.legendary?.includes(key)) {
			return PathbuilderCharacterProficiencyType.Legendary;
		}
		if (this.core?.specificProficiencies?.master?.includes(key)) {
			return PathbuilderCharacterProficiencyType.Master;
		}
		if (this.core?.specificProficiencies?.expert?.includes(key)) {
			return PathbuilderCharacterProficiencyType.Expert;
		}
		if (this.core?.specificProficiencies?.trained?.includes(key)) {
			return PathbuilderCharacterProficiencyType.Trained;
		}
		return PathbuilderCharacterProficiencyType.Untrained;
	}

	//#endregion

	public get lores(): TPathbuilderCharacterLore[] {
		return this.core.lores ?? [];
	}
	public hasLore(loreName: string): boolean { return this.getLore(loreName) !== undefined; }
	private getLore(loreName: string): TPathbuilderCharacterLore | undefined { return this.lores.find(lore => lore[0] === loreName); }
	public getLoreMod(loreName: string): number {
		const lore = this.getLore(loreName);
		const profMod = lore?.[1] ?? 0;
		const levelMod = this.getLevelMod(profMod);
		return levelMod + profMod + this.abilities.intMod;
	}

	public getSkillMod(skillName: string): number {
		const skillIndex = skillNames.indexOf(skillName);
		const profMod = this.getProficiencyMod(skillName as TPathbuilderCharacterProficienciesKey);
		const levelMod = this.getLevelMod(profMod);
		const statMod = Abilities.scoreToMod(this.abilities[skillStatKeys[skillIndex]]);
		return levelMod + profMod + statMod;
	}

	public getProficiencyAndMod(key: string): [TProficiency, number] {
		if (key === "Perception") {
			return [this.getProficiency(key as TPathbuilderCharacterProficienciesKey), this.perceptionMod];
		}
		if (skillNames.includes(key)) {
			return [this.getProficiency(key as TPathbuilderCharacterProficienciesKey), this.getSkillMod(key)];
		}
		if (this.hasLore(key)) {
			const lore = this.getLore(key)!;
			return [PathbuilderCharacterProficiencyType[lore[1]] as TProficiency, this.getLoreMod(key)];
		}
		if (getSavingThrows().includes(key as TSavingThrow)) {
			const ability = SavingThrows.getAbilityForSavingThrow(key as TSavingThrow);
			const check = this.savingThrows.getSavingThrow(key as TSavingThrow, ability ?? "Constitution");
			return [this.getProficiency(key as TPathbuilderCharacterProficienciesKey), check.modifier];
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

	public toHtmlName(): string {
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
			push(`${bracketTraits(this.core.alignment, PathbuilderCharacterSizeType[this.core.size], this.core.ancestry, this.core.heritage)}`);
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

		if (includes(["All", "Stats"])) {
			push();
			push(`${abilitiesToHtml(this)}`);
			push(`<b>AC</b> ${this.core.acTotal.acTotal}; ${this.savingThrows.toHtml()}`);
			push(`<b>HP</b> ${this.maxHp}`);
		}

		if (includes(["All", "Speed"])) {
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
	public getValidSections<V extends string = TCharacterSectionType>(): V[] {
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
		const hasMoney = Object.keys(this.core.money).find(key => this.core.money[key as keyof TPathbuilderCharacterMoney]);
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

		return outputTypes as V[];
	}
	public getValidViews<V extends string = TCharacterViewType>(): V[] {
		const outputTypes: TCharacterViewType[] = [];

		if (this.core.weapons?.length) {
			outputTypes.push("Combat");
		}

		//#region Equipment
		const hasEquipment = this.core.equipment.length > 0;
		const hasMoney = Object.keys(this.core.money).find(key => this.core.money[key as keyof TPathbuilderCharacterMoney]);
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

		return outputTypes as V[];
	}

	//#endregion

	//#region fetch

	public static fetch(id: number, flags?: TPathbuilderCharacterCustomFlags): Promise<PathbuilderCharacter | null> {
		return this.fetchCore(id)
			.then(core => new PathbuilderCharacter(core, flags), () => null);
	}

	public static fetchCore(id: number): Promise<TPathbuilderCharacter> {
		return new Promise<TPathbuilderCharacter>(async (resolve, reject) => {
			try {
				const url = `https://pathbuilder2e.com/json.php?id=${id}`;
				const json = await getJson<TPathbuilderCharacterResponse>(url).catch(reject);
// writeFileSync(`pathfbuilder2e-${id}.json`, json);
				if (json?.success) {
					json.build.exportJsonId = id;
					resolve(json.build);
				}else {
					reject(stringify(json));
				}
			}catch (ex) {
				reject(ex);
			}
		});
	}
	/*
	Pathbuilder uses the Share Character build number by POSTing the following JSON:
		{ "id": "622381" }
	to the url:
		https://pathbuilder2e.com/app/fetch_emailed.php
	with content type:
		"application/json"
	theh results are the raw json used by pathbuilder to manage a character ... NOT THE EXPORTED JSON
	 */

	//#endregion

	//#region save/load

	public static createFilePath(characterId: string): string {
		return `${getDataRoot("sage")}/pb2e/${characterId}.json`;
	}
	public static exists(characterId: string): boolean {
		return fileExistsSync(this.createFilePath(characterId));
	}
	public static loadCharacterSync(characterId: string): PathbuilderCharacter | null {
		try {
			const core = readJsonFileSync<TPathbuilderCharacter>(this.createFilePath(characterId));
			return core ? new PathbuilderCharacter(core) : null;
		}catch(ex) {
			return errorReturnNull(ex);
		}
	}
	public static async loadCharacter(characterId: string): Promise<PathbuilderCharacter | null> {
		const core = await readJsonFile<TPathbuilderCharacter>(this.createFilePath(characterId)).catch(errorReturnNull);
		return core ? new PathbuilderCharacter(core) : null;
	}
	public static async saveCharacter(character: TPathbuilderCharacter | PathbuilderCharacter): Promise<boolean> {
		const json = "toJSON" in character ? character.toJSON() : character;
		return writeFile(this.createFilePath(character.id), json, true).catch(errorReturnFalse);
	}
	public async save(): Promise<boolean> {
		return PathbuilderCharacter.saveCharacter(this);
	}
	public static async refresh(characterId: string, id?: number, newName?: string): Promise<RefreshResult> {
		const oldChar = await this.loadCharacter(characterId);
		if (!oldChar) {
			return "INVALID_CHARACTER_ID";
		}

		const exportJsonId = id ?? oldChar.exportJsonId;
		if (!exportJsonId) {
			return "MISSING_JSON_ID";
		}

		const newChar = await this.fetchCore(exportJsonId);
		if (!newChar) {
			return "INVALID_JSON_ID";
		}

		if (oldChar.name !== newChar.name && newChar.name !== newName) {
			return "INVALID_CHARACTER_NAME";
		}

		newChar.id = oldChar.id;
		newChar.characterId = oldChar.characterId;
		newChar.messageId = oldChar.messageId;
		newChar.userDid = oldChar.userDid;

		return this.saveCharacter(newChar);
	}

	//#endregion
}
type RefreshResult = "INVALID_CHARACTER_ID" | "MISSING_JSON_ID" | "INVALID_JSON_ID" | "INVALID_CHARACTER_NAME" | true | false;