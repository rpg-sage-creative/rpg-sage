import utils, { OrUndefined } from "../../../sage-utils";
import type { TProficiency } from "../../common";
import { toModifier } from "../../common";
import { findByValue as repoFind, filter as repoFilter } from "../../data/Repository";
import type Weapon from "../Weapon";
import type { IHasAbilities } from "./Abilities";
import Abilities from "./Abilities";
import type { IHasProficiencies } from "./PlayerCharacter";
import type { IHasSavingThrows } from "./SavingThrows";
import SavingThrows from "./SavingThrows";
import { ABILITIES } from "../..";

//#region types

enum PathbuilderCharacterProficiencyType {
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
	res: "resilient" | "greater resilient" | "major resilient";
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

export type TPathbuilderCharacter = {
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
		return `<b>${utils.StringUtils.capitalize(key)}</b> ${toModifier(mod)}`;
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
	const NAME = 0, PROFMOD = 1, core = char.toJSON();
	return core.lores.map(l => `${l[NAME]} ${toModifier(core.level + l[PROFMOD] + char.abilities.intMod)}`).join(", ");
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
	const core = char.toJSON();
	const statKeys: TPathbuilderCharacterAbilityKey[] = ["dex", "int", "str", "int", "cha", "cha", "cha", "wis", "wis", "int", "cha", "wis", "int", "dex", "wis", "dex"];
	return "Acrobatics,Arcana,Athletics,Crafting,Deception,Diplomacy,Intimidation,Medicine,Nature,Occultism,Performance,Religion,Society,Stealth,Survival,Thievery"
		.split(",").map((skill, index) => {
			const profMod = char.getProficiencyMod(skill as TPathbuilderCharacterProficienciesKey);
			if (!profMod) {
				return "";
			}
			const levelMod = core.level;
			const statMod = Abilities.scoreToMod(core.abilities[statKeys[index]]);
			return `${skill} ${toModifier(levelMod + profMod + statMod)}`;
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

function spellCasterToHtml(char: PathbuilderCharacter, spellCaster: TPathbuilderCharacterSpellCaster): string {
	const label = spellCasterToLabel(spellCaster);
	const mod = char.level
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

function spellCasterLevelToHtml(char: PathbuilderCharacter, spellCaster: TPathbuilderCharacterSpellCaster, spells: TPathbuilderCharacterSpellCasterSpells, maxLevel: number): string {
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

function doPets(char: PathbuilderCharacter): string[] {
	return char.toJSON().pets.map(pet => {
		if (pet.type === "Familiar") {
			const name = pet.name.includes(pet.specific) ? pet.name : `${pet.name} (${pet.specific})`;
			return `<b>${pet.type}</b> ${name}; ${pet.abilities.join(", ")}`;
		}else if (pet.type === "Animal Companion") {
			const name = pet.name.includes(pet.animal) ? pet.name : `${pet.name} (${pet.animal})`;
			const specializations = pet.specializations.length ? `; ${pet.specializations.join(", ")}` : ``;
			const equipment = pet.equipment.length ? `; ${equipmentToHtml(pet.equipment)}` : ``;
			return `<b>${pet.type}</b> ${name}${specializations}${equipment}`;
		}else {
			console.log(JSON.stringify(pet));
			return pet.name;
		}
	});
}

function doEquipmentMoney(char: PathbuilderCharacter) {
	const out = [];
	const core = char.toJSON();
	const hasEquipment = core.equipment.length > 0;
	const hasMoney = Object.keys(core.money).find(key => core.money[key as keyof TPathbuilderCharacterMoney]);
	if (hasEquipment || hasMoney) {
		out.push();
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
		const mod = char.level
			+ weaponToAttackStatMod(wpnItem, char.abilities.strMod, char.abilities.dexMod)
			+ char.getProficiencyMod(weapon.prof as TPathbuilderCharacterProficienciesKey, weapon.name)
			+ weapon.pot;
		const dmg = weaponToDamage(char, weapon, wpnItem);
		return `<b>${wpnItem.type}</b> ${weapon.display} ${toModifier(mod)} <b>Damage</b> ${dmg}`;
	}else {
		// Figure out if type is melee/ranged
		const type = "Custom";
		const mod = char.level
			+ char.getProficiencyMod(weapon.prof as TPathbuilderCharacterProficienciesKey)
			+ weapon.pot;
		const dmg = `${strikingToDiceCount(weapon.str)}${weapon.die}`;
		return `<b>${type}</b> ${weapon.display} ${toModifier(mod)} <b>Damage</b> ${dmg}; <i>Dex/Str/Spec mods not included</i>`;
	}
}

//#endregion

//#endregion

function eq(a: string, b: string, matcher = false): boolean {
	if (matcher) {
		return utils.StringUtils.StringMatcher.matches(a, b);
	}
	return a.toLowerCase() === b.toLowerCase();
}

export default class PathbuilderCharacter extends utils.ClassUtils.SuperClass implements IHasAbilities, IHasProficiencies, IHasSavingThrows {

	public constructor(private core: TPathbuilderCharacter) {
		super();
	}
	public toJSON(): TPathbuilderCharacter { return this.core; }

	public get name(): string { return this.core.name; }

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

	//#region IHasProficiencies

	public getProficiency(key: TPathbuilderCharacterProficienciesKey, specificKey?: string): TProficiency {
		return <TProficiency>PathbuilderCharacterProficiencyType[this.getProficiencyMod(key, specificKey)];
	}

	public getProficiencyMod(key: TPathbuilderCharacterProficienciesKey, specificKey?: string): PathbuilderCharacterProficiencyType {
		const keys = Object.keys(this.core.proficiencies) as TPathbuilderCharacterProficienciesKey[];
		const lower = key.toLowerCase();
		const found = keys.find(k => k.toLowerCase() === lower);
		const keyMod = found ? this.core.proficiencies[found] ?? 0 : 0;
		const specificMod = specificKey ? this.getSpecificProficiencyMod(specificKey) : 0;
		return Math.max(keyMod, specificMod);
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

	public get perceptionMod(): number {
		return this.core.level + this.core.proficiencies.perception + this.abilities.wisMod;
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
			+ (attributes.classhp + attributes.bonushpPerLevel + this.abilities.conMod) * this.core.level;
	}

	//#region toHtml

	private toHtmlName(): string {
		const name = this.core.name;
		const klass = this.core.class;
		const dualClass = this.core.dualClass ? `/${this.core.dualClass}` : ``;
		const level = this.core.level;
		return `${name} - ${klass}${dualClass} ${level}`;
	}

	public toHtml(): string {
		const html: string[] = [];
		push(`<b><u>${this.toHtmlName()}</u></b>`);
		push(`${bracketTraits(this.core.alignment, PathbuilderCharacterSizeType[this.core.size], this.core.ancestry, this.core.heritage)}`);
		push(`<b>Perception</b> ${toHtmlPerception(this)}`);
		push(`<b>Languages</b> ${this.core.languages.join(", ")}`);
		push(`<b>Skills</b> ${skillsToHtml(this)}; <b>Lore</b> ${loreToHtml(this)}; <i>mods from gear excluded</i>`);
		push(`${abilitiesToHtml(this)}`);
		if (this.core.weapons.length || this.core.armor.length) {
			push(`<b>Items</b> ${itemsToHtml(this.core.weapons, this.core.armor)}`);
		}
		push();
		push(`<b>AC</b> ${this.core.acTotal.acTotal}; ${this.savingThrows.toHtml()}`);
		push(`<b>HP</b> ${this.maxHp}`);
		push();
		push(`<b>Speed</b> ${calculateSpeed(this)} feet`);
		if (this.core.weapons.length) {
			push();
			this.core.weapons.map(weapon => weaponToHtml(this, weapon)).forEach(push);
		}
		if (this.core.spellCasters?.length) {
			push();
			this.core.spellCasters.map(spellCaster => spellCasterToHtml(this, spellCaster)).forEach(push);
		}
		if (this.core.pets?.length) {
			push();
			doPets(this).forEach(push);
		}
		doEquipmentMoney(this).forEach(push);
		if (this.feats.length) {
			push();
			push(`<b>Feats</b> ${this.feats.map(mapFeat).join(", ")}`);
		}
		if (this.core.formula?.length) {
			push();
			const one = this.core.formula.length === 1;
			this.core.formula.forEach(formulaType => {
				const type = formulaType.type !== "other" || one ? ` (${formulaType.type})` : ``;
				push(`<b>Formula Book${type}</b> ${formulaType.known.join(", ")}`);
			});

		}
		return html.join("");
		function push(value?: string) {
			html.push(`${html.length ? "<br/>" : ""}${value ?? "---"}`);
		}
	}

	//#endregion

	//#region fetch

	public static fetch(id: number): Promise<PathbuilderCharacter | null> {
		return this.fetchCore(id)
			.then(core => new PathbuilderCharacter(core), () => null);
	}

	public static fetchCore(id: number): Promise<TPathbuilderCharacter> {
		return new Promise<TPathbuilderCharacter>(async (resolve, reject) => {
			try {
				const url = `https://pathbuilder2e.com/json.php?id=${id}`;
				const json = await utils.HttpsUtils.getJson<TPathbuilderCharacterResponse>(url).catch(reject);
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
