import { CharacterBase } from "@rsc-utils/game-utils";
import { addCommas, capitalize, debug, errorReturnFalse, errorReturnUndefined, getDataRoot, nth, randomSnowflake, sortPrimitive, stringifyJson, StringMatcher, type Optional, type OrUndefined } from "@rsc-utils/core-utils";
import { fileExistsSync, readJsonFile, readJsonFileSync, writeFile } from "@rsc-utils/io-utils";
import { Ability } from "../../../gameSystems/d20/lib/Ability.js";
import type { PathbuilderCharacterCore, StrikingRune, TPathbuilderCharacterAbilityKey, TPathbuilderCharacterAnimalCompanion, TPathbuilderCharacterArmor, TPathbuilderCharacterCustomFlags, TPathbuilderCharacterEquipment, TPathbuilderCharacterFamiliar, TPathbuilderCharacterFeat, TPathbuilderCharacterFocusStat, TPathbuilderCharacterFocusTradition, TPathbuilderCharacterLore, TPathbuilderCharacterMoney, TPathbuilderCharacterProficienciesKey, TPathbuilderCharacterSpellCaster, TPathbuilderCharacterSpellCasterSpells, TPathbuilderCharacterWeapon, WeaponGrade } from "../../../gameSystems/p20/import/pathbuilder-2e/types.js";
import type { IHasAbilities } from "../../../gameSystems/p20/lib/Abilities.js";
import { Check } from "../../../gameSystems/p20/lib/Check.js";
import type { IHasProficiencies } from "../../../gameSystems/p20/lib/Proficiencies.js";
import { Proficiency } from "../../../gameSystems/p20/lib/Proficiency.js";
import { Skill } from "../../../gameSystems/p20/lib/Skill.js";
import { ProficiencyType, SizeType } from "../../../gameSystems/p20/lib/types.js";
import { toModifier } from "../../../gameSystems/utils/toModifier.js";
import type { DiceMacroBase } from "../../../sage-lib/sage/model/Macro.js";
import type { GetStatPrefix } from "../../common.js";
import { filter as repoFilter, findByValue as repoFind } from "../../data/Repository.js";
import { ABILITIES } from "../../index.js";
import type { Weapon } from "../Weapon.js";
import { PbcAbilities } from "./PbcAbilities.js";
import { SavingThrows, type IHasSavingThrows } from "./SavingThrows.js";

//#region helpers

function bracketTraits(...traits: string[]): string {
	const filtered = traits.map(t => t?.trim()).filter(t => t);
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
		const score = core.abilities[key], mod = Ability.scoreToMod(score);
		return `<b>${capitalize(key)}</b> ${toModifier(mod)}`;
	}).join(", ");
}

function itemsToHtml(weapons: TPathbuilderCharacterWeapon[], armors: TPathbuilderCharacterArmor[]): string {
	const weaponNames = weapons.map(weapon => weapon.display ?? weapon.name);
	const armorNames = armors.map(armor => armor.display ?? armor.name);
	return weaponNames.concat(armorNames).join(", ");
}

function calculateSpeed(char: PathbuilderCharacter): number {
	const core = char.toJSON();
	const mod = core.attributes.speedBonus ?? 0;
	return mod + core.attributes.speed;
}

//#region skill / lore

function getLoreRegexp(): RegExp {
	return /(^lore(?!master)\W*)|(\W*lore$)/ig;
}

function loreToHtml(char: PathbuilderCharacter): string {
	const NAME = 0, PROFMOD = 1;
	return char.lores.map(l => {
		const profMod = l[PROFMOD];
		return `${l[NAME]} ${toModifier(char.getLevelMod(profMod) + profMod + char.abilities.intMod)}`;
	}).join(", ");
}

function skillsToHtml(char: PathbuilderCharacter): string {
	return Skill.all().map(skill => {
		const check = Check.forSkill(char, skill);
		if (!check) {
			return "";
		}

		const prof = check.proficiencyModifier?.proficiency ?? "Untrained";
		if (prof === "Untrained") {
			return "";
		}

		return `${skill.name} ${toModifier(check.modifier)}`;
	}).filter(s => s).join(", ");
}

//#endregion

//#region spellCaster

function isArcaneSense(spellCaster: TPathbuilderCharacterSpellCaster): boolean {
	return /^(caster )?arcane sense$/i.test(spellCaster.name);
}

function spellCasterToLabel(spellCaster: TPathbuilderCharacterSpellCaster): string {
	if (/^(arcane|divine|occult|primal) (prepared|spontaneous) spells$/i.test(spellCaster.name)) {
		return spellCaster.name;
	}
	if (/(^(wand|scroll|staff|cantrip deck) of)|((staff|wand)$)/i.test(spellCaster.name)) {
		return spellCaster.name;
	}
	if (isArcaneSense(spellCaster)) {
		return "Arcane Sense";
	}
	if (["Cleric Font", "Other Spells (Staves etc)"].includes(spellCaster.name)) {
		return spellCaster.name;
	}
	if (spellCaster.name.startsWith("Caster ")) {
		return spellCaster.name.slice("Caster ".length);
	}
	if (spellCaster.magicTradition === "focus") {
		return "Focus Spells";
	}
	const tradition = capitalize(spellCaster.magicTradition);
	const type = capitalize(spellCaster.spellcastingType);
	return `${spellCaster.name} Spells (${tradition} ${type})`;
}

function spellsListToHtml(spells: string[]): string {
	const mappedSpells = spells.reduce((map, spell) => {
		if (spell) {
			const lower = spell;//.toLowerCase();
			map.set(lower, (map.get(lower) ?? 0) + 1);
		}
		return map;
	}, new Map<string, number>());
	const sortedSpells = [...mappedSpells.keys()].sort(sortPrimitive);
	const formattedSpells = sortedSpells.map(spell => {
		const name = `<i>${spell}</i>`;
		const count = mappedSpells.get(spell) ?? 0;
		const times = count > 1 ? ` x${count}` : ``;
		return name + times;
	});
	return formattedSpells.join(", ");
}

function spellCasterToHtml(char: PathbuilderCharacter, spellCaster: TPathbuilderCharacterSpellCaster): string {
	const label = spellCaster.spellcastingType === "prepared" ? `Prepare Spells (${spellCaster.name})` : spellCasterToLabel(spellCaster);
	const mod = char.getLevelMod(spellCaster.proficiency)
		+ char.abilities.getAbilityScoreModifier(ABILITIES.find(abil => abil.toLowerCase().startsWith(spellCaster.ability))!)
		+ spellCaster.proficiency;
	const isFocus = spellCaster.magicTradition === "focus" || spellCaster.focusPoints > 0;
	const dcAttackLabel = isArcaneSense(spellCaster) ? `` : ` DC ${10+mod}, attack +${mod};`;
	const spellsToDisplay = spellCaster.spellcastingType === "prepared"
		? spellCaster.prepared
		: spellCaster.spells;
	const spellLevels = spellsToDisplay.map((spells, level) => {
		if (!spells) {
			return null;
		}
		if (!isFocus && spellCaster.perDay[level] === 0) {
			return null;
		}
		const levelLabel = `<b>${spellCasterLevelToHtml(char, spellCaster, spells, Math.ceil(char.level / 2))}</b>`;
		const slots = !isFocus && spellCaster.spellcastingType === "spontaneous" && level ? ` (${spellCaster.perDay[level] ?? 0} slots)` : ``;
		const list = spellsListToHtml(spells.list);
		return `${levelLabel}${slots} ${list}`;
	}).filter(s => s).reverse();
	return `<b>${label}</b>${dcAttackLabel} ${spellLevels.join("; ")}`;
}

function spellCasterToKnownHtml(spellCaster: TPathbuilderCharacterSpellCaster): string {
	const label = `Spells Known (${spellCaster.name})`;
	const spellLevels = spellCaster.spells.map((spells) => {
		if (!spells?.list.length) {
			return null;
		}
		const levelLabel = `<b>${spells.spellLevel ? nth(spells.spellLevel) : `Cantrips`}</b>`;
		const list = spellsListToHtml(spells.list);
		return `${levelLabel} ${list}`;
	}).filter(s => s);
	return `<b>${label}</b> ${spellLevels.join("; ")}`;
}

function focusSpellsToHtml(char: PathbuilderCharacter): string[] {
	const { focus } = char.toJSON();
	const focusSpells: string[] = [];
	if (focus) {
		const italicize = (s: string) => `<i>${s}</i>`;
		Object.keys(focus).forEach(tradition => {
			const trad = focus[tradition as keyof typeof focus] as TPathbuilderCharacterFocusTradition;
			if (trad) {
				Object.keys(trad).forEach(ability => {
					const abil = trad[ability as keyof typeof trad] as TPathbuilderCharacterFocusStat;
					if (abil) {
						const cantrips = abil.focusCantrips ?? [];
						const spells = abil.focusSpells ?? [];
						if (cantrips.length || spells.length) {
							const list: string[] = [];
							if (spells.length) {
								list.push(spells.map(italicize).join(", "));
							}
							if (cantrips.length) {
								list.push(`cantrips ${cantrips.map(italicize).join(", ")}`);
							}
							const mod = abil.abilityBonus + abil.itemBonus + abil.proficiency + char.level;
							focusSpells.push(`<b>${capitalize(tradition)} Focus Spells (${nth(Math.ceil(char.level / 2))})</b> DC ${10+mod}, attack +${mod}; ${list.join("; ")}`);
						}
					}
				});
			}
		});
	}
	return focusSpells;
}

function spellCasterLevelToHtml(char: PathbuilderCharacter, spellCaster: TPathbuilderCharacterSpellCaster, spells: TPathbuilderCharacterSpellCasterSpells, cantripLevel: number): string {
	if (spellCaster.name === "Caster Arcane Sense") {
		const arcana = char.getProficiency("arcana");
		switch (arcana.abbr) {
			case "L": return `Cantrip (4th)`;
			case "M": return `Cantrip (3rd)`;
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
			debug(stringifyJson(pet));
			return pet.name;
		}
	});
}

//#endregion

//#region equipment / money

function moneyToHtml(money: TPathbuilderCharacterMoney): string {
	const coins = <string[]>[];
	if (money.pp) {
		coins.push(`${addCommas(money.pp)} pp`);
	}
	if (money.gp) {
		coins.push(`${addCommas(money.gp)} gp`);
	}
	if (money.sp) {
		coins.push(`${addCommas(money.sp)} sp`);
	}
	if (money.cp) {
		coins.push(`${addCommas(money.cp)} cp`);
	}
	if (money.credits) {
		coins.push(`${addCommas(money.credits)} credits`);
	}
	if (money.upb) {
		coins.push(`${addCommas(money.upb)} upb`);
	}
	return coins.join(", ");
}
function moneyToJsonString({ cp, sp, gp, pp, credits, upb }: TPathbuilderCharacterMoney = { }) {
	return stringifyJson({ cp:cp||0, sp:sp||0, gp:gp||0, pp:pp||0, credits:credits||0, upb:upb||0 });
}

function equipmentToHtml(equipment: TPathbuilderCharacterEquipment[]): string {
	const NAME = 0, COUNT = 1;
	return equipment.map(o => o[COUNT] > 1 ? `${o[NAME]} x${o[COUNT]}` : o[NAME]).join(", ");
}

function doEquipmentMoney(char: PathbuilderCharacter) {
	const out = [];
	const core = char.toJSON();
	const containers = Object.entries(core.equipmentContainers ?? {});
	const hasEquipment = core.equipment.length > 0;
	const hasMoney = Object.keys(core.money).some(key => core.money[key as keyof TPathbuilderCharacterMoney]);
	if (hasEquipment || containers.length || hasMoney) {
		if (hasEquipment || containers.length) {
			const worn: string[] = [];
			const containerMap = new Map<string, string[]>();
			containers.forEach(([id]) => containerMap.set(id, []));
			const NAME = 0, COUNT = 1, CONTAINER = 2;
			core.equipment.forEach(item => {
				const label = item[COUNT] > 1 ? `${item[NAME]} x${item[COUNT]}` : item[NAME];
				const containerId = item[CONTAINER];
				if (containerId && containerMap.has(containerId)) {
					containerMap.get(containerId)?.push(label);
				}else {
					worn.push(label);
				}
			});
			out.push(`<b>Equipment</b> ${worn.join(", ")}`.trim());
			containers.forEach(([id, container]) => out.push(`- <b>${container.containerName}</b> ${containerMap.get(id)?.join(", ") ?? ""}`.trim()));
		}
		if (hasMoney) {
			out.push(`<b>Currency</b> ${moneyToHtml(core.money)}`);
		}
	}
	return out;
}

//#endregion

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

function getWeaponDamageDie({ grade, str }: TPathbuilderCharacterWeapon): number {
	const value = grade?.trim() ? grade.trim().toLowerCase() as WeaponGrade : str?.trim().toLowerCase() as StrikingRune;
	switch(value) {
		// Pathfinder
		case "striking": return 2;
		case "greater striking": return 3;
		case "major striking": return 4;

		// Starfinder (commerical and tactical are both only 1 die)
		case "advanced": return 2;
		case "superior": return 2;
		case "elite": return 3;
		case "ultimate": return 3;
		case "paragon": return 4;

		// Both
		default: return 1;
	}
}

function weaponToDamage(char: PathbuilderCharacter, weapon: TPathbuilderCharacterWeapon, weaponItem: Weapon): string {
	const modNumber =
		weaponToDamageStrMod(weaponItem, char.abilities.strMod)
		+ getWeaponSpecMod(char, weapon);
	const modString = modNumber ? toModifier(modNumber) : "";
	return weaponItem.damage?.replace(/1d/, `${getWeaponDamageDie(weapon)}d`)
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
		return prof?.modifier ?? 0;
	}
	return 0;
}

/** Creates the XdY part of a weapon's damage. */
function getWeaponDamageDice(weapon: TPathbuilderCharacterWeapon): string {
	const dmgDieCount = getWeaponDamageDie(weapon);
	const dmgDieSize = weapon.die?.replace(/\dd/, "d") ?? "d?";
	return `${dmgDieCount}${dmgDieSize}`;
}

/** Creates the weapon's damage DicePart of format "dice bonus type". */
function getWeaponDamageDicePart(weapon: TPathbuilderCharacterWeapon): string {
	const dmgDice = getWeaponDamageDice(weapon);
	const dmgBonus = weapon.damageBonus ? toModifier(weapon.damageBonus) : "";
	const dmgType = weapon.damageType ?? "";
	const damage = `${dmgDice} ${dmgBonus} ${dmgType}`;
	return damage.replace(/\s+/, " ").trim();
}

/** Get's the weapon's item bonus to attack from a potency crystal or weapon grade. */
function getWeaponAttackItemBonus(weapon: TPathbuilderCharacterWeapon): number {
	switch(weapon.grade) {
		case "commercial": return 0;
		case "tactical": return 1;
		case "advanced": return 1;
		case "superior": return 2;
		case "elite": return 2;
		case "ultimate": return 3;
		case "paragon": return 3;
		default: return weapon.pot || 0;
	}
}

function weaponToHtml(char: PathbuilderCharacter, weapon: TPathbuilderCharacterWeapon): string {
	if (weapon.dice) {
		return `<b>${weapon.name}</b> ${weapon.dice}`;
	}
	if (typeof(weapon.attack) === "number" && typeof(weapon.damageBonus) === "number") {
		const damage = getWeaponDamageDicePart(weapon);
		return `<b>${weapon.display}</b> ${toModifier(weapon.attack)} <b>Damage</b> ${damage}`;
	}
	const wpnItem = findWeapon(weapon);
	if (wpnItem) {
		const profMod = char.getProficiencyMod(weapon.prof as TPathbuilderCharacterProficienciesKey, weapon.name);
		const levelMod = char.getLevelMod(profMod);
		const mod = levelMod
			+ weaponToAttackStatMod(wpnItem, char.abilities.strMod, char.abilities.dexMod)
			+ char.getProficiencyMod(weapon.prof as TPathbuilderCharacterProficienciesKey, weapon.name)
			+ getWeaponAttackItemBonus(weapon);
		const dmg = weaponToDamage(char, weapon, wpnItem);
		return `<b>${wpnItem.type}</b> ${weapon.display} ${toModifier(mod)} <b>Damage</b> ${dmg}`;
	}else {
		/** @todo Figure out if type is melee/ranged */
		const type = "Custom";
		const profMod = char.getProficiencyMod(weapon.prof as TPathbuilderCharacterProficienciesKey);
		const levelMod = char.getLevelMod(profMod);
		const mod = levelMod
			+ profMod
			+ getWeaponAttackItemBonus(weapon);
		const dmg = getWeaponDamageDice(weapon);
		return `<b>${type}</b> ${weapon.display} ${toModifier(mod)} <b>Damage</b> ${dmg}; <i>Dex/Str/Spec mods not included</i>`;
	}
}

type WeaponMacroDiceArgs = { name:string; atkDice?:string; atkMod:number; dmg:string; dmgNote?:string; };

/** Reusable logic for weaponToMacro() */
function buildWeaponMacroDice({ name, atkDice, atkMod, dmg, dmgNote }: WeaponMacroDiceArgs): DiceMacroBase {
	const attack = `${atkDice ?? "1d20"} ${atkMod ? toModifier(atkMod) : ""} "${name}" {atkBonus:+0} {ac}`;
	const damage = `${dmg} {dmgBonus:+0} ${dmgNote ?? ""}`;
	const dice = `[${attack}; ${damage}]`.replace(/\s+/, " ").trim();
	return { name, dice };
}

function weaponToMacro(char: PathbuilderCharacter, weapon: TPathbuilderCharacterWeapon): DiceMacroBase {
	if (weapon.dice) {
		return { name:weapon.name, dice:weapon.dice };
	}

	const name = weapon.display;

	if (typeof(weapon.attack) === "number" && typeof(weapon.damageBonus) === "number") {
		const atkMod = weapon.attack;
		const dmg = getWeaponDamageDicePart(weapon);
		return buildWeaponMacroDice({ name, atkMod, dmg });
	}

	const wpnItem = findWeapon(weapon);
	if (wpnItem) {
		const profMod = char.getProficiencyMod(weapon.prof as TPathbuilderCharacterProficienciesKey, weapon.name);
		const levelMod = char.getLevelMod(profMod);
		const atkMod = levelMod
			+ weaponToAttackStatMod(wpnItem, char.abilities.strMod, char.abilities.dexMod)
			+ profMod
			+ getWeaponAttackItemBonus(weapon);
		const dmg = weaponToDamage(char, weapon, wpnItem);
		return buildWeaponMacroDice({ name, atkMod, dmg });

	}else {
		const profMod = char.getProficiencyMod(weapon.prof as TPathbuilderCharacterProficienciesKey);
		const levelMod = char.getLevelMod(profMod);
		const atkMod = levelMod
			+ profMod
			+ getWeaponAttackItemBonus(weapon);
		const dmg = getWeaponDamageDice(weapon);
		const dmgNote = "<i>Dex/Str/Spec mods may not be included</i>";
		return buildWeaponMacroDice({ name, atkMod, dmg, dmgNote });
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

export type TCharacterSectionType = "All" | "Armor" | "Attacks" | "Equipment" | "Feats" | "Formulas" | "Languages" | "Perception" | "Pets" | "Skills" | "Speed" | "Spells" | "SpellsKnown" | "Stats" | "Traits" | "Weapons";
export const CharacterSectionTypes: TCharacterSectionType[] = ["All", "Armor", "Attacks", "Equipment", "Feats", "Formulas", "Languages", "Perception", "Pets", "Skills", "Speed", "Spells", "SpellsKnown", "Stats", "Traits", "Weapons"];
export function getCharacterSections(view: Optional<TCharacterViewType>): TCharacterSectionType[] | null {
	switch(view) {
		case "All": return ["All"];
		case "Combat": return ["Traits", "Perception", "Languages", "Skills", "Weapons", "Armor", "Stats", "Speed", "Attacks"];
		case "Equipment": return ["Traits", "Perception", "Languages", "Skills", "Weapons", "Armor", "Equipment"];
		case "Feats": return ["Traits", "Perception", "Languages", "Skills", "Feats"];
		case "Formulas": return ["Traits", "Perception", "Languages", "Skills", "Formulas"];
		case "Pets": return ["Traits", "Perception", "Languages", "Skills", "Pets"];
		case "Spells": return ["Traits", "Perception", "Languages", "Skills", "Spells", "SpellsKnown"];
	}
	return null;
}

export type TCharacterViewType = "All" | "Combat" | "Equipment" | "Feats" | "Formulas" | "Pets" | "Spells";
export const CharacterViewTypes: TCharacterViewType[] = ["All", "Combat", "Equipment", "Feats", "Formulas", "Pets", "Spells"];

export type TPathbuilderCharacter = PathbuilderCharacterCore;

export class PathbuilderCharacter extends CharacterBase<PathbuilderCharacterCore> implements IHasAbilities, IHasProficiencies, IHasSavingThrows {
	public get exportJsonId(): number | undefined { return this.core.exportJsonId; }

	public createCheck(key: string): Check | undefined {
		if (/^perc(eption)?$/i.test(key)) {
			return Check.forSkill(this, Skill.findByName("Perception"));
		}

		const skill = Skill.findByName(key);
		if (skill) {
			return Check.forSkill(this, skill);
		}

		if (SavingThrows.isValidKey(key)) {
			return this.savingThrows.getCheck(key);
		}

		const lore = this.getLore(key);
		const loreRegex = getLoreRegexp();
		if (lore || loreRegex.test(key)) {
			const check = lore ? Check.forSkill(this, Skill.forLore(lore[0])) : undefined;

			const isBardic = /bardic/i.test(key);
			const isLoremaster = /loremaster/i.test(key);

			const bLore = this.getLore("Bardic");
			const bCheck = bLore ? Check.forSkill(this, Skill.forLore(bLore[0])) : undefined;
			if (bCheck && !isBardic) {
				bCheck.subject = `Bardic Lore (${capitalize(key.replace(loreRegex, ""))})`;
			}

			const lLore = this.getLore("Loremaster");
			const lCheck = lLore ? Check.forSkill(this, Skill.forLore(lLore[0])) : undefined;
			if (lCheck && !isLoremaster) {
				lCheck.subject = `Loremaster Lore (${capitalize(key.replace(loreRegex, ""))})`;
			}

			if (bCheck && lCheck) {
				bCheck.addCircumstanceModifier("Loremaster", 1);
			}

			const loreMod = check?.modifier ?? 0;
			const loremasterMod = lCheck?.modifier ?? 0;
			const bardicMod = bCheck?.modifier ?? 0;

			const bestMod = Math.max(loreMod, loremasterMod, bardicMod);
			const best = [check, isLoremaster ? undefined : bCheck, isBardic ? undefined : lCheck].find(check => check?.modifier === bestMod);
			return best ?? check;
		}

		if (Ability.isValid(key)) {
			return this.abilities.getCheck(key);
		}

		const profKeyRegex = new RegExp(`^${key}$`, "i");
		const profKey = Object.keys(this.core.proficiencies).find(profKey => profKeyRegex.test(profKey)) as TPathbuilderCharacterProficienciesKey;
		if (profKey) {
			const check = new Check(this, profKey);
			check.addProficiency(profKey);
			if (profKey === "classDC") {
				check.setAbility(Ability.findByName(this.core.keyability).name);
			}
			/** @todo take a long look at all other proficiencies to see how this needs to be expanded */
			return check;
		}

		return undefined;
	}

	public getStat(stat: string): number | string | null {
		const lower = stat.toLowerCase();
		const [prefix, statLower] = lower.includes(".") ? lower.split(".") as [GetStatPrefix, string] : [undefined, lower] as [GetStatPrefix | undefined, string];

		// special case for showing full ability score
		if (!prefix && Ability.isValid(statLower) && stat.length > 3) {
			return this.abilities[statLower.slice(0, 3) as "str"];
		}

		switch(statLower) {
			case "pp": case "gp": case "sp": case "cp": case "upb": case "credits": return this.core.money[statLower] ?? null;
			case "activeexploration": return this.getSheetValue("activeExploration") ?? null;
			case "initskill": return this.getInitSkill();
			case "level": return this.level;
			case "maxhp": return this.maxHp;
			case "ac": return prefix === "prof" ? this.core.acTotal?.acProfBonus ?? null : this.core.acTotal?.acTotal ?? null;
			case "classdc": return this.createCheck(statLower)?.toStatString(prefix ?? "dc") ?? null;
			default: return this.createCheck(statLower)?.toStatString(prefix) ?? null;
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
			core[key as keyof TPathbuilderCharacterCustomFlags] = flags[key as keyof TPathbuilderCharacterCustomFlags];
		});

		this.abilities = new PbcAbilities(this);
		this.feats = this.core.feats ?? [];
		this.savingThrows = SavingThrows.for(this);
	}

	public getAttackMacros(): DiceMacroBase[] { return this.core.weapons?.map(weapon => weaponToMacro(this, weapon)) ?? []; }
	public getSpellMacros(): DiceMacroBase[] { return []; }

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
	public abilities: PbcAbilities;
	public feats: TPathbuilderCharacterFeat[];
	public savingThrows: SavingThrows;

	//#region level

	public get level(): number {
		return this.core.level;
	}

	public async setLevel(level: number, save: boolean): Promise<boolean> {
		if (level > 0 && level < 21 && level !== this.core.level) {
			this.core.level = level;
			if (save) {
				return this.save();
			}
			return true;
		}
		return false;
	}

	public async setMoney(money: TPathbuilderCharacterMoney, save: boolean): Promise<boolean> {
		const coreMoney = this.core.money ??= { };
		const coreString = moneyToJsonString(coreMoney);
		const moneyString = moneyToJsonString(money);
		if (coreString !== moneyString) {
			const keys = ["cp", "sp", "gp", "pp", "credits", "upb"] as (keyof TPathbuilderCharacterMoney)[];
			keys.forEach(key => coreMoney[key] = money[key] ?? coreMoney[key] ?? 0);
			if (save) {
				return this.save();
			}
			return true;
		}
		return false;
	}

	/** If using the untrained penalty option of proficiency without level, you have a -2 when untrained instead of a 0. */
	public get untrainedProficiencyMod(): number {
		return this.core._untrainedPenalty === true ? -2 : 0;
	}

	/** If using the proficiency without level option, you don't use your level modifier on checks. */
	public get trainedLevelMod(): number {
		return this.core._proficiencyWithoutLevel === true ? 0 : this.level;
	}

	/**
	 * Returns the level mod, taking into account if the character is trained and applicable optional rules.
	 */
	public getLevelMod(profMod: number): number;
	public getLevelMod(trained: boolean): number;
	public getLevelMod(arg: boolean | number): number {
		const trained = typeof(arg) === "boolean" ? arg : arg > 0;
		return trained ? this.trainedLevelMod : 0;
	}

	//#endregion

	//#region IHasProficiencies

	public getProficiency(key: TPathbuilderCharacterProficienciesKey, specificKey?: string): Proficiency {
		const profMod = this.getProficiencyMod(key, specificKey);
		return profMod === this.untrainedProficiencyMod
			? Proficiency.findByName("U")
			: Proficiency.findByModifier(profMod) ?? debug({key,specificKey,profMod}) ?? Proficiency.findByName("U");
	}

	public getProficiencyMod(key: TPathbuilderCharacterProficienciesKey, specificKey?: string): ProficiencyType {
		const keys = Object.keys(this.core.proficiencies) as TPathbuilderCharacterProficienciesKey[];
		const lower = key.toLowerCase();
		const found = keys.find(k => k.toLowerCase() === lower);
		if (found) {
			const keyMod = this.core.proficiencies[found] ?? 0;
			const specificMod = specificKey ? this.getSpecificProficiencyMod(specificKey) : 0;
			const profMod = Math.max(keyMod, specificMod);
			return !profMod ? this.untrainedProficiencyMod : profMod;
		}
		const lore = this.getLore(key);
		if (lore) {
			const keyMod = lore[1];
			const specificMod = specificKey ? this.getSpecificProficiencyMod(specificKey) : 0;
			const profMod = Math.max(keyMod, specificMod);
			return !profMod ? this.untrainedProficiencyMod : profMod;
		}
		return this.untrainedProficiencyMod;
	}
	private getSpecificProficiencyMod(key: string): ProficiencyType {
		if (this.core?.specificProficiencies?.legendary?.includes(key)) {
			return ProficiencyType.Legendary;
		}
		if (this.core?.specificProficiencies?.master?.includes(key)) {
			return ProficiencyType.Master;
		}
		if (this.core?.specificProficiencies?.expert?.includes(key)) {
			return ProficiencyType.Expert;
		}
		if (this.core?.specificProficiencies?.trained?.includes(key)) {
			return ProficiencyType.Trained;
		}
		return ProficiencyType.Untrained;
	}

	//#endregion

	public get lores(): TPathbuilderCharacterLore[] {
		return this.core.lores ?? [];
	}

	public getLore(loreName: string): TPathbuilderCharacterLore | undefined {
		if (!loreName) {
			return undefined;
		}

		const loreRegex = getLoreRegexp();
		const clean = (name: string) => name?.replace(loreRegex, "").toLowerCase();

		loreName = clean(loreName);

		const lore = this.lores.find(lore => clean(lore[0]) === loreName)?.slice() as TPathbuilderCharacterLore | undefined;
		if (!lore) {
			return undefined;
		}

		lore[0] = `${capitalize(loreName)} Lore`;

		const isLegendary = (skill: string) => this.getProficiencyMod(skill as TPathbuilderCharacterProficienciesKey) === ProficiencyType.Legendary;
		if (/bardic/i.test(loreName)) {
			lore[1] = isLegendary("Occultism") ? ProficiencyType.Expert : ProficiencyType.Trained;
		}else if (/loremaster/i.test(loreName)) {
			lore[1] = ["Arcana", "Occultism", "Religion", "Society"].some(isLegendary) ? ProficiencyType.Expert : ProficiencyType.Trained;
		}

		return lore;
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
	/** max hit points */
	public get maxHp(): number {
		const attributes = this.core.attributes;
		return attributes.ancestryhp + attributes.bonushp
			+ (attributes.classhp + attributes.bonushpPerLevel + this.abilities.conMod) * this.level;
	}

	/** max focus points */
	public get maxFp(): number {
		let focusPoints = this.core.focusPoints ?? 0;
		this.core.spellCasters.forEach(sc => focusPoints = Math.max(focusPoints, sc.focusPoints));
		return focusPoints;
	}

	//#region toHtml

	public toHtmlName(): string {
		const name = this.core.names?.name;
		const klass = this.core.class;
		const dualClass = this.core.dualClass ? `/${this.core.dualClass}` : ``;
		const level = this.level;
		return `${name} - ${klass}${dualClass} ${level}`;
	}

	public toHtml(outputTypes: TCharacterSectionType[] = ["All"]): string {
		const html: string[] = [];

		push(`<b><u>${this.toHtmlName()}</u></b>`);

		if (includes(["All", "Traits"])) {
			push(`${bracketTraits(SizeType[this.core.size], this.core.ancestry, this.core.heritage ?? "")}`);
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
			push(`<b>AC</b> ${this.core.acTotal?.acTotal ?? "??"}; ${this.savingThrows.toHtml()}; <b>Class DC</b> ${this.getStat("classdc")}`);
			const hitFocusPoints = [`<b>HP</b> ${this.maxHp}`];
			const maxFp = this.maxFp;
			if (maxFp) {
				hitFocusPoints.push(`<b>Focus Points</b> ${maxFp}`);
			}
			push(hitFocusPoints.join("; "));
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
			focusSpellsToHtml(this).forEach(push);
		}

		const preparedCasters = this.core.spellCasters?.filter(caster => caster?.spellcastingType === "prepared");
		if (includes(["All", "SpellsKnown"]) && preparedCasters?.length) {
			push();
			preparedCasters.map(preparedCaster => spellCasterToKnownHtml(preparedCaster)).forEach(push);
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

		if (this.core.spellCasters?.filter(caster => caster?.spellcastingType === "prepared").length) {
			outputTypes.push("SpellsKnown");
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

	//#region save/load

	public static createFilePath(characterId: string): string {
		return `${getDataRoot("sage")}/pb2e/${characterId}.json`;
	}
	public static exists(characterId: string): boolean {
		return fileExistsSync(PathbuilderCharacter.createFilePath(characterId));
	}
	public static loadCharacterSync(characterId: string): PathbuilderCharacter | undefined {
		try {
			const core = readJsonFileSync<TPathbuilderCharacter>(PathbuilderCharacter.createFilePath(characterId));
			return core ? new PathbuilderCharacter(core) : undefined;
		}catch(ex) {
			return errorReturnUndefined(ex);
		}
	}
	public static async loadCharacter(characterId: string): Promise<PathbuilderCharacter | null> {
		const core = await readJsonFile<TPathbuilderCharacter>(PathbuilderCharacter.createFilePath(characterId)).catch(errorReturnUndefined);
		return core ? new PathbuilderCharacter(core) : null;
	}
	public static async saveCharacter(character: TPathbuilderCharacter | PathbuilderCharacter): Promise<boolean> {
		const json = "toJSON" in character ? character.toJSON() : character;
		return writeFile(PathbuilderCharacter.createFilePath(character.id), json, { makeDir:true }).catch(errorReturnFalse);
	}
	public async save(): Promise<boolean> {
		return PathbuilderCharacter.saveCharacter(this);
	}

	//#endregion
}
