import { debug, randomSnowflake, type Optional } from "@rsc-utils/core-utils";
import { PdfJsonFieldManager, type PdfJson } from "@rsc-utils/io-utils";
import { PathbuilderCharacter, type TPathbuilderCharacter } from "../../../sage-pf2e/index.js";
import { ProficiencyType, SizeType } from "../lib/types.js";
import { getSf2ePlaytestPdfKeyMap, type PdfKeyMapItem } from "./getSf2ePlaytestPdfKeyMap.js";
import type { TPathbuilderCharacterWeapon } from "../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { toMod } from "../../../sage-dice/index.js";

function parseSize(value: Optional<string>): SizeType {
	if (value) {
		const letter = value[0].toUpperCase();
		for (const key in SizeType) {
			if (String(key)[0] === letter) {
				return SizeType[key as keyof typeof SizeType];
			}
		}
	}
	return SizeType.Medium;
}

function parseAbilityScore(sValue: Optional<string>): number {
	if (!sValue?.trim()) return 10;
	const nValue = +sValue;
	if (isNaN(nValue)) return 10;
	if (nValue < 7) return nValue * 2 + 10;
	return nValue;
}

/** [ [name, null, type, level] ] */
function parseFeats(mgr: PdfJsonFieldManager, keyMap: PdfKeyMapItem[]): [string, null, string, number][] {
	const feats: [string, null, string, number][] = [];
	const keyRegex = /^(?<type>ancestry|background|class|general|skill)Feat(?<level>\d+)?$/;
	for (const item of keyMap) {
		const match = keyRegex.exec(item?.sageKey ?? "");
		if (match) {
			const name = mgr.getValue(item.pdfId);
			if (name) {
				feats.push([name, null, match.groups?.type!, +(match.groups?.level ?? 1)]);
			}
		}
	}
	return feats;
}

function _parseEquipment(mgr: PdfJsonFieldManager, key: string, count: number): [string, number][] {
	const equipment: [string, number][] = [];
	for (let i = 1; i <= count; i++) {
		const item = mgr.getValue(`${key}${i}`);
		// const bulk = mgr.getValue(`${key}${i}Bulk`);
		// const invested = mgr.getValue(`${key}${i}Invested`);
		// const mag = mgr.getValue(`${key}${i}Magazine`);
		if (item) equipment.push([item, 1]);
	}
	return equipment;
}

function parseEquipment(mgr: PdfJsonFieldManager): [string, number][] {
	const equipment: [string, number][] = [];
	equipment.push(..._parseEquipment(mgr, "heldItem", 13));
	equipment.push(..._parseEquipment(mgr, "consumableItem", 14));
	equipment.push(..._parseEquipment(mgr, "wornItem", 9));
	equipment.push(..._parseEquipment(mgr, "weapon", 9));
	return equipment;
}

function _parseWeapon(mgr: PdfJsonFieldManager, key: string): TPathbuilderCharacterWeapon | undefined {
	const name = mgr.getValue(`${key}Name`);
	if (name) {
		const damage = mgr.getValue(`${key}Damage`);
		if (damage) {
			const stat = key.startsWith("m") ? "Str" : "Dex";
			debug({ key, mod:mgr.getNumber(`${key}Mod`), stat:mgr.getNumber(`${key}${stat}Mod`, 0) });
			const diceAttack = mgr.getNumber(`${key}Mod`)
				?? (mgr.getNumber(`${key}${stat}Mod`, 0) + mgr.getNumber(`${key}ProfMod`, 0) + mgr.getNumber(`${key}ItemMod`, 0));
			const traits = mgr.getArray(`${key}Traits`)?.map(s => s.trim()).filter(s => s) ?? [];
			const diceTraits = traits.length ? ` (${traits.join(", ")})` : ``;
			const dice = `[1d20 ${toMod(diceAttack)} ${name}${diceTraits}; ${damage}]`;
			return { name, dice } as TPathbuilderCharacterWeapon;
		}
	}
	return undefined;
}
function parseWeapons(mgr: PdfJsonFieldManager): TPathbuilderCharacterWeapon[] {
	const weapons: TPathbuilderCharacterWeapon[] = [];
	["melee", "ranged"].forEach(which => {
		for (let i = 1; i < 5; i++) {
			const weapon = _parseWeapon(mgr, `${which}${i}`);
			if (weapon) weapons.push(weapon);
		}
	});
	return weapons;
}

function parseCharacterCore(rawJson: PdfJson): TPathbuilderCharacter {
	const pdfKeyMap = getSf2ePlaytestPdfKeyMap();
	const mgr = new PdfJsonFieldManager(rawJson, f => ({ id:pdfKeyMap[+f.name.replace(/\D/g, "")]?.sageKey, ...f }));
	// const getPdfId = (sageKey: string) => pdfKeyMap.find(pair => pair.sageKey === sageKey)?.pdfId;

	const getAbility = (key: string) => parseAbilityScore(mgr.getValue(key));
	const getArray = (key: string, delim = ",") => mgr.getArray(key, delim)?.map(s => s.trim()).filter(s => s) ?? [];
	const getProfMod = (skill: string): number => {
		return (mgr.getChecked(`${skill}Legendary`) ? ProficiencyType.Legendary : undefined)
			?? (mgr.getChecked(`${skill}Master`) ? ProficiencyType.Master : undefined)
			?? (mgr.getChecked(`${skill}Expert`) ? ProficiencyType.Expert : undefined)
			?? (mgr.getChecked(`${skill}Trained`) ? ProficiencyType.Trained : undefined)
			?? mgr.getNumber(`${skill}ProfMod`)
			?? ProficiencyType.Untrained;
	};
	const abilities = {
		str: getAbility("strMod"),
		dex: getAbility("dexMod"),
		con: getAbility("conMod"),
		int: getAbility("intMod"),
		wis: getAbility("wisMod"),
		cha: getAbility("chaMod"),
	};
	// hack: let's assume the highest ability is their key ability
	const keyability = ["str","dex","con","int","wis","cha"].reduce((key, abil) =>
		abilities[key as keyof typeof abilities] > abilities[abil as keyof typeof abilities] ? key : abil
	, "str") as keyof typeof abilities;
	return {
		objectType: "P20Character",
		id: randomSnowflake(),
		name: mgr.getValue("name") ?? undefined,
		class: mgr.getValue("class", ""),
		// dualClass?: string;
		level: mgr.getNumber("level", 1),
		ancestry: mgr.getValue("ancestry", ""),
		heritage: mgr.getValue("heritage", ""),
		background: mgr.getValue("background", ""),
		gender: mgr.getValue("pronouns", ""),
		age: mgr.getValue("age", ""),
		deity: mgr.getValue("philosophy", ""),
		size: parseSize(mgr.getValue("size")),
		keyability,
		languages: getArray("languages"),
		attributes: {
			ancestryhp: 0,
			bonushp: mgr.getNumber("maxHp", 0),
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
		spellCasters: [],//TPathbuilderCharacterSpellCaster[];
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

export function jsonToCharacter(rawJson: PdfJson): PathbuilderCharacter {
	return new PathbuilderCharacter(parseCharacterCore(rawJson));
}