import { capitalize, randomSnowflake, type Optional } from "@rsc-utils/core-utils";
import { PdfJsonFieldManager } from "@rsc-utils/io-utils";
import { parseSize } from "../../../import/pathbuilder-2e/parseSize.js";
import type { PathbuilderCharacterCore, TPathbuilderCharacterAbilityKey, TPathbuilderCharacterSpellCaster, TPathbuilderCharacterWeapon } from "../../../import/pathbuilder-2e/types.js";
import { ProficiencyType } from "../../../lib/types.js";
import type { PdfKeyMap } from "./types.js";

function parseAbilityScore(sValue: Optional<string>): number {
	if (!sValue?.trim()) return 10;
	const nValue = +sValue;
	if (isNaN(nValue)) return 10;
	if (nValue < 7) return nValue * 2 + 10;
	return nValue;
}

/** [ [name, null, type, level] ] */
function parseFeats(mgr: PdfJsonFieldManager, keyMap: PdfKeyMap): [string, null, string, number][] {
	const feats: [string, null, string, number][] = [];

	const playtestRegex = /^(?<type>ancestry|background|class|general|skill)Feat(?<level>\d+)?$/;
	const demiplaneRegex = /^feat_\d+$/;

	for (const [pdfId, item] of keyMap) {
		if (!item?.sageKey) continue;

		// playtest pdf
		const playtestMatch = playtestRegex.exec(item.sageKey);
		if (playtestMatch) {
			const name = mgr.getValue(pdfId);
			if (name) {
				feats.push([name, null, playtestMatch.groups?.type!, +(playtestMatch.groups?.level ?? 1)]);
			}
		}

		// demiplane pdf
		const demiplaneMatch = demiplaneRegex.exec(item.sageKey);
		if (demiplaneMatch) {
			const name = mgr.getValue(pdfId);
			if (name) {
				feats.push([name, null, "", 0]);
			}
		}
	}

	return feats;
}

function _parseEquipment(mgr: PdfJsonFieldManager, key: string, start: number, count: number): [string, number][] {
	const equipment: [string, number][] = [];
	let i = start;
	for (let counter = 1; counter <= count; i++, counter++) {
		const item = mgr.getValue(`${key}${i}`);
		// playtest pdf
		// const bulk = mgr.getValue(`${key}${i}Bulk`);
		// const invested = mgr.getValue(`${key}${i}Invested`);
		// const mag = mgr.getValue(`${key}${i}Magazine`);
		// demiplane pdf
		// const bulk = mgr.getValue(`${key}${i}_bulk`);
		if (item) equipment.push([item, 1]);
	}
	return equipment;
}

function parseEquipment(mgr: PdfJsonFieldManager): [string, number][] {
	const equipment: [string, number][] = [];

	// playtest pdf
	equipment.push(..._parseEquipment(mgr, "heldItem", 1, 13));
	equipment.push(..._parseEquipment(mgr, "consumableItem", 1, 14));
	equipment.push(..._parseEquipment(mgr, "wornItem", 1, 9));
	equipment.push(..._parseEquipment(mgr, "weapon", 1, 9));

	// demiplane pdf
	equipment.push(..._parseEquipment(mgr, "item_", 0, 29));

	return equipment;
}

function _parseWeapon(mgr: PdfJsonFieldManager, key: string): TPathbuilderCharacterWeapon | undefined {
	const name = mgr.getValue(`${key}Name`);
	if (name) {
		const attack = mgr.getNumber(`${key}Mod`, 0);
		const damage = mgr.getValue(`${key}Damage`, "");
		if (damage) {
			const { count = "0", size = "0", mod = "0" } = /(?<count>\d)d(?<size>\d+)\s*(?<mod>\b[+-]\s*\d+\b)?/i.exec(damage)?.groups ?? {};
			const pot = +/^\+(?<pot>[123])\D/.exec(name)?.groups?.pot! || 0;
			const str = ["", "", "striking", "greater striking", "major striking"][+count] as "striking" ?? "";
			const die = `d${size}`;
			const damageBonus = +mod.replace(/\s+/g, "");
			const damageType = capitalize(/[^a-z](?<damageType>[SBPECFAM]|So|Po)$/i.exec(damage)?.groups?.damageType ?? "");
			const grade = /\b(?<grade>commercial|tactical|advanced|superior|elite|ultimate|paragon)\b/i.exec(name)?.groups?.grade.toLowerCase() ?? "";
			return {
				name,
				qty: 1,
				// prof: "martial",
				die,
				pot,
				str,
				// mat: null,
				display: name,
				// runes: [],
				damageType,
				attack,
				damageBonus,
				// extraDamage: [],
				// increasedDice: false,
				// isInventor: false,
				grade,
			} as TPathbuilderCharacterWeapon;
		}
	}
	return undefined;
}
function parseWeapons(mgr: PdfJsonFieldManager): TPathbuilderCharacterWeapon[] {
	const weapons: TPathbuilderCharacterWeapon[] = [];
	["melee", "ranged"].forEach(which => {
		for (let i = 1; i < 5; i++) {
			const weapon = _parseWeapon(mgr, `${which}${i}`);
			if (weapon) {
				weapons.push(weapon);
			}
		}
	});
	return weapons;
}

type SpellByName = { name:string; actions:string; rank:number; prepared:number; costs:string; frequency:string; };
function parseSpellsByName(mgr: PdfJsonFieldManager, base: string): SpellByName[] {
	const spells: SpellByName[] = [];
	const suffixes = ["spell", "ritual"].includes(base) ? ["", "2"] : [""];
	suffixes.forEach(suffix => {
		const names = mgr.getArray(`${base}Names${suffix}`) ?? [];
		if (names.length) {
			const actions = mgr.getArray(`${base}Actions${suffix}`) ?? [];
			const prepared = mgr.getArray(`${base}Prepared${suffix}`) ?? [];
			const ranks = mgr.getArray(`${base}Ranks${suffix}`) ?? [];
			const costs = mgr.getArray(`${base}Costs${suffix}`) ?? [];
			const frequencies = mgr.getArray(`${base}Frequency${suffix}`) ?? [];
			names.forEach((name, index) => spells.push({
				name,
				actions: actions[index],
				rank: (+ranks[index] || 0),
				prepared: (+prepared[index] || 0),
				costs: costs[index],
				frequency:frequencies[index]
			}));
		}
	});
	return spells;
}
function parseSpells(mgr: PdfJsonFieldManager, level: number, keyAbility: TPathbuilderCharacterAbilityKey): TPathbuilderCharacterSpellCaster[] {
	const proficiency = Math.max(_getProfMod(mgr, "spellAttack", level), _getProfMod(mgr, "spellDc", level));
	const perDay = [1,2,3,4,5,6,7,8,9,10].map(level => mgr.getNumber(`spellsPerDay${level}`, 0));
	perDay.unshift(mgr.getNumber("cantripsPerDay", 0));
	const spells = parseSpellsByName(mgr, "cantrip").concat(parseSpellsByName(mgr, "spell"));
	if (proficiency || perDay.some(n => n) || spells.length) {
		return [{
			name: mgr.getValue("class", ""),
			magicTradition: "arcane",
			spellcastingType: spells.find(sp => sp.prepared > 0) ? "prepared" : "spontaneous",
			ability: keyAbility,
			proficiency,
			focusPoints: 0,
			innate: false,
			perDay,
			spells: [0,1,2,3,4,5,6,7,8,9,10].map(spellLevel => {
				return { spellLevel, list:spells.filter(spell => spell.rank === spellLevel).map(spell => spell.name) };
			}).filter(({ list }) => list.length),
			prepared: [0,1,2,3,4,5,6,7,8,9,10].map(spellLevel => {
				const list: string[] = [];
				spells.forEach(spell => { if (spell.rank === spellLevel) for (let i = 0; i < spell.prepared; i++) list.push(spell.name); });
				return { spellLevel, list };
			}).filter(({ list }) => list.length),
			blendedSpells: [],
		}];
	}
	return [];
}
function parseFocusSpells(mgr: PdfJsonFieldManager, level: number, keyAbility: TPathbuilderCharacterAbilityKey): TPathbuilderCharacterSpellCaster[] {
	const spells = parseSpellsByName(mgr, "focusSpell");
	if (spells.length) {
		return [{
			name: "Focus Spells",
			magicTradition: "focus",
			spellcastingType: "spontaneous",
			ability: keyAbility,
			proficiency: Math.max(_getProfMod(mgr, "spellAttack", level), _getProfMod(mgr, "spellDc", level)),
			focusPoints: 0,
			innate: false,
			perDay: [],
			spells: [{ spellLevel:0, list:spells.map(spell => spell.name) }],
			prepared: [],
			blendedSpells: [],
		}];
	}
	return [];
}
function parseInnateSpells(mgr: PdfJsonFieldManager, level: number, keyAbility: TPathbuilderCharacterAbilityKey): TPathbuilderCharacterSpellCaster[] {
	const spells = parseSpellsByName(mgr, "innateSpell");
	if (spells.length) {
		return [{
			name: "Innate Spells",
			magicTradition: "arcane",
			spellcastingType: "spontaneous",
			ability: keyAbility,
			proficiency: Math.max(_getProfMod(mgr, "spellAttack", level), _getProfMod(mgr, "spellDc", level)),
			focusPoints: 0,
			innate: true,
			perDay: [],
			spells: [{ spellLevel:0, list:spells.map(spell => spell.name) }],
			prepared: [],
			blendedSpells: [],
		}];
	}
	return [];
	// const rituals = parseSpellsByName(mgr, "ritual");
	// return { level, rank, perDay, spells };
}
function parseSpellCasters(mgr: PdfJsonFieldManager, level: number, keyAbility: TPathbuilderCharacterAbilityKey): TPathbuilderCharacterSpellCaster[] {
	const spellCasters: TPathbuilderCharacterSpellCaster[] = [];
	spellCasters.push(...parseSpells(mgr, level, keyAbility));
	spellCasters.push(...parseFocusSpells(mgr, level, keyAbility));
	spellCasters.push(...parseInnateSpells(mgr, level, keyAbility));
	return spellCasters;
}
function _getProfMod(mgr: PdfJsonFieldManager, what: string, level?: number): number {
	const woLevel = (value?: number | null) => value ? value - (level ?? mgr.getNumber("level", 1)) : value;
	return (mgr.getChecked(`${what}Legendary`) ? ProficiencyType.Legendary : undefined)
		?? (mgr.getChecked(`${what}Master`) ? ProficiencyType.Master : undefined)
		?? (mgr.getChecked(`${what}Expert`) ? ProficiencyType.Expert : undefined)
		?? (mgr.getChecked(`${what}Trained`) ? ProficiencyType.Trained : undefined)
		?? woLevel(mgr.getNumber(`${what}ProfMod`))
		?? ProficiencyType.Untrained;
}
export function parseCharacterCore(mgr: PdfJsonFieldManager, pdfKeyMap: PdfKeyMap): PathbuilderCharacterCore | undefined {
	const level = mgr.getNumber("level", 1);
	const getAbility = (key: string) => parseAbilityScore(mgr.getValue(key));
	const getArray = (key: string) => mgr.getArray(key)?.map(s => s.trim()).filter(s => s) ?? [];
	const getProfMod = (skill: string): number => _getProfMod(mgr, skill, level);
	const abilities = {
		str: getAbility("strMod"),
		dex: getAbility("dexMod"),
		con: getAbility("conMod"),
		int: getAbility("intMod"),
		wis: getAbility("wisMod"),
		cha: getAbility("chaMod"),
	};
	const { size, sizeName } = parseSize(mgr.getValue("size"));
	// hack: let's assume the highest ability is their key ability
	const keyability = ["str","dex","con","int","wis","cha"].reduce((key, abil) =>
		abilities[key as keyof typeof abilities] > abilities[abil as keyof typeof abilities] ? key : abil
	, "str") as keyof typeof abilities;
	return {
		objectType: "P20Character",
		id: randomSnowflake(),
		name: mgr.getValue("name") ?? undefined,
		class: mgr.getValue("class", ""),
		dualClass: null,
		level,
		xp: mgr.getNumber("xp", 0),
		ancestry: mgr.getValue("ancestry", ""),
		heritage: mgr.getValue("heritage", ""),
		background: mgr.getValue("background", ""),
		gender: mgr.getValue("pronouns", ""),
		age: mgr.getValue("age", ""),
		deity: mgr.getValue("philosophy", ""),
		size,
		sizeName,
		keyability,
		languages: getArray("languages"),
		attributes: {
			ancestryhp: 0,
			bonushp: mgr.getNumber("maxHp", 0) - abilities.con * level,
			bonushpPerLevel: 0,
			classhp: 0,
			speed: mgr.getNumber("speed", 0),
			speedBonus: 0,
		},
		abilities,
		proficiencies: {
			classDC: getProfMod("classDc"),
			perception: getProfMod("perception"),
			fortitude: getProfMod("fortitude"),
			reflex: getProfMod("reflex"),
			will: getProfMod("will"),
			heavy: getProfMod("heavyArmor"),
			medium: getProfMod("mediumArmor"),
			light: getProfMod("lightArmor"),
			unarmored: getProfMod("unarmored"),
			advanced: getProfMod("advanced"),
			martial: getProfMod("martial"),
			simple: getProfMod("simple"),
			unarmed: getProfMod("unarmed"),
			castingArcane: getProfMod("castingArcane"),//
			castingDivine: getProfMod("castingDivine"),//
			castingOccult: getProfMod("castingOccult"),//
			castingPrimal: getProfMod("castingPrimal"),//
			acrobatics: getProfMod("acrobatics"),
			arcana: getProfMod("arcana"),
			athletics: getProfMod("athletics"),
			crafting: getProfMod("crafting"),
			deception: getProfMod("deception"),
			diplomacy: getProfMod("diplomacy"),
			intimidation: getProfMod("intimidation"),
			medicine: getProfMod("medicine"),
			nature: getProfMod("nature"),
			occultism: getProfMod("occultism"),
			performance: getProfMod("performance"),
			religion: getProfMod("religion"),
			society: getProfMod("society"),
			stealth: getProfMod("stealth"),
			survival: getProfMod("survival"),
			thievery: getProfMod("thievery"),
			piloting: getProfMod("piloting"),
			computers: getProfMod("computers"),
		},
		feats: parseFeats(mgr, pdfKeyMap),
		specials: getArray("senses"),
		lores: [
			[mgr.getValue("lore1Name"), getProfMod("lore1")],
			[mgr.getValue("lore2Name"), getProfMod("lore2")]
		].filter(pair => pair[0]) as [string, number][],
		equipment: parseEquipment(mgr),
		specificProficiencies: {
			trained: [],
			expert: [],
			master: [],
			legendary: [],
		},
		weapons: parseWeapons(mgr),
		money: { credits:mgr.getNumber("credits", 0), upb:mgr.getNumber("upb", 0) },
		armor: [],//TPathbuilderCharacterArmor[];
		spellCasters: parseSpellCasters(mgr, level, keyability),
		formula: [],//TPathbuilderCharacterFormula[];
		pets: [],//TPathbuilderCharacterPet[];
		acTotal: {
			acProfBonus: getProfMod("ac"),
			acAbilityBonus: mgr.getNumber("acDexMod", 0),// ?? getAbility("dex")
			acItemBonus: mgr.getNumber("acItemMod", 0),
			acTotal: mgr.getNumber("ac", 0),// ??
		},
	};
}
