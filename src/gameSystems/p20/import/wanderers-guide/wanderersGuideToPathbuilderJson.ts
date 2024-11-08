import { debug, randomSnowflake, type Optional, type UUID } from "@rsc-utils/core-utils";
import { capitalize } from "@rsc-utils/string-utils";
import type { TPathbuilderCharacter, TPathbuilderCharacterAbilities, TPathbuilderCharacterAbilityKey, TPathbuilderCharacterArmor, TPathbuilderCharacterEquipment, TPathbuilderCharacterProficiencies, TPathbuilderCharacterSpellCaster, TPathbuilderCharacterSpellCasterSpells, TPathbuilderCharacterWeapon, TPathbuilderEquipmentContainers } from "../../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { Ability } from "../../../d20/lib/Ability.js";
import { Skill } from "../../lib/Skill.js";
import { parseSize } from "../pathbuilder-2e/parseSize.js";

type Base = {
	id: number;
	created_at: string; // iso
	name: string;
}

type Coins = { pp:""|number; gp:""|number; sp:""|number; cp:""|number; };

type OperationType = "setValue" | "giveLanguage";
type OperationDataVariable = "SIZE" | "MAX_HEALTH_ANCESTRY" | "MAX_HEALTH_BONUS" | "MAX_HEALTH_CLASS_PER_LEVEL" | "CLASS_DC";
// { type:"setValue"; data{ variable:"MAX_HEALTH_ANCESTRY"; value:number; }}
type Operation = { id:UUID; type:OperationType; data:{ variable:OperationDataVariable; value:number|string|{value:string;attribute:string;}; languageId?:number; }; };
type HasOperations = { operations: Operation[]; };
type CanHaveOperations = { operations: Operation[] | null; };
type FeatOrFeature = Base & CanHaveOperations & { type:string; level:number };

type WanderersGuideWeapon = {
	item: Base & CanHaveOperations & {
		group: "WEAPON";
		meta_data: {
			category: string;
			group: string;
			material: { grade:null; type:null; };
			runes: { striking:number; potency:number; property:[]; };
		};
	};
	stats: {
		attack_bonus: {
			total: number[];
			parts: {};
		};
		damage: {
			dice: number;
			die: `d${number}`;
			damageType: string;
			bonus: {
				total: number;
				parts: {};
			};
			other:[];
			extra: string;
		};
	};
};

type WanderersGuideArmor = {
	id: UUID;
	item: Base & CanHaveOperations & {
		bulk: string;
		group: "ARMOR";
		meta_data: {
			ac_bonus: number;
			check_penalty: number;
			speed_penalty: number;
			dex_cap: number;
			strength: number;
			group: string;
			material: { grade:null; type:null; };
			runes: { potency:number; property:[]; };
		};
		is_equipped: boolean;
	};
};

type WanderersGuideItemItem = Base & HasOperations & {
	bulk: string;
	level: number;
	rarity: string;
	description: string;
	group: string;
	hands: string | null;
	size: string;
	craft_requirements: null;
	usage: null;
	meta_data: {};
	content_source_id: number;
	version: string;
	uuid: number;
	price: Coins;
	traits: [];
	availability: null;
};
type WanderersGuideItem = {
	id: UUID;
	item: WanderersGuideItemItem;
	is_formula: boolean;
	is_equipped: boolean;
	is_invested: boolean;
	container_contents: WanderersGuideItem[];
};
type WanderersGuideNotes = { pages: { name:string; icon:string; color:string; contents:{ type:"doc"; content:{ type:"paragraph"; attr:{ textAlign:"string"; }; content:{ type:"text"; text:string; }[]; }[]; }; }[]; };
type WanderersGuideDetails = {
	ancestry: Base & HasOperations;
	background: Base & HasOperations;
	class: Base & HasOperations;
	conditions: [];
	image_url: string;
	info?: {
		appearance?: string;
		personality?: string;
		alignment?: string;
		beliefs?: string;
		age?: string;
		height?: string;
		weight?: string;
		gender?: string;
		pronouns?: string;
		faction?: string;
		ethnicity?: string;
		nationality?: string;
		birthplace?: string;
		organized_play_id?: string;
		reputation?: number;
		organized_play_adventures?: [];
	};
};
type WanderersGuideSpellSource = {
	source: WanderersGuideSpellSourceRef;
	stats: {
		spell_attack: {
			total: number[];
			parts: {};
		};
		spell_dc: {
			total: number;
			parts: {};
		};
	};
};
type WanderersGuideSpellSourceRef = {
	/** ex: "BARD" */
	name: string;
	/** ex: "SPONTANEOUS-REPERTOIRE" */
	type: string;
	/** ex: "OCCULT" */
	tradition: string;
	/** ex: ATTRIBUTE_CHA */
	attribute: string;
};
type WanderersGuideSpellRef = {
	spell_id: number;
	rank: number;
	/** ex: "BARD" */
	source: string;
};
type WanderersGuideSpellSlot = {
	/** ex: "CHARACTER-spell-slot-0" */
	id: string;
	rank: number;
	/** ex: "BARD" */
	source: string;
	/** rank > 0 */
	exhausted?: boolean;
};
type WanderersGuideSpellRawData = {
	slots: WanderersGuideSpellSlot[];
	list: WanderersGuideSpellRef[];
	focus: WanderersGuideSpellRef[];
	innate: WanderersGuideSpellRef[];
	sources: WanderersGuideSpellSourceRef[];
};
type WanderersGuideSpell = Base & {
	rank: number;
	traditions: [];
	rarity: string;
	case: string;
	traits: number[];
	meta_data: {
		focus: boolean;
	};
	/** ex: "BARD" */
	casting_source: string;
};
type WanderersGuideCharacter = Base & {
	user_id: UUID;
	level: number;
	experience: number;
	hp_current: number;
	hp_temp: number;
	hero_points: number;
	stamina_current: number;
	resolve_current: number;
	inventory: {
		coins: Coins;
		items: WanderersGuideItem[];
	};
	notes: WanderersGuideNotes | null;
	details: WanderersGuideDetails;
	// spells: WanderersGuideSpells;
};
type WanderersGuideContent = {
	_README: string;
	all_traits: [];
	feats_features: {
		generalAndSkillFeats: FeatOrFeature[];
		classFeats: FeatOrFeature[];
		ancestryFeats: FeatOrFeature[];
		otherFeats: FeatOrFeature[];
		classFeatures: FeatOrFeature[];
		physicalFeatures: FeatOrFeature[];
		heritages: FeatOrFeature[];
	};
	character_traits: [];
	languages: string[];
	senses: {
		precise: [];
		imprecise: [];
		vague: [];
	};
	weapons: WanderersGuideWeapon[];
	inventory_flat: [];
	total_bulk: string;
	spell_raw_data: WanderersGuideSpellRawData;
	spell_sources: WanderersGuideSpellSource[];
	spell_slots: WanderersGuideSpellSlot[];
	spells: {
		all: WanderersGuideSpell[];
		cantrips: WanderersGuideSpell[];
		normal: WanderersGuideSpell[];
		rituals: WanderersGuideSpell[];
	};
	focus_spells: WanderersGuideSpell[];
	innate_spells: WanderersGuideSpell[];
	size: string;
	speeds: { name:string; value:{ total:number; value:number; bonus:number; bmap:{}; }}[];
	max_hp: number;
	ac: number;
	shield_item: null;
	armor_item: WanderersGuideArmor | null;
	resist_weaks: {};
	proficiencies: {
		// SAVE_FORT
		// SKILL_ACROBATICS
		// SKILL_LORE_SPORTS
		// SPELL_ATTACK
		// LIGHT_ARMOR
		[key: string]: {
			total: string;
			parts: {
				level: number;
				profValue: number;
				attributeMod: number;
				hasConditionals: boolean;
				breakdown: {
					bonuses: {};
					bonusValue: number;
					conditionals: [];
				};
			};
		};
	};
	attributes: {
		// ATTRIBUTE_STR
		[key: string]: {
			// modifier
			value: number;
			partial: boolean;
		}
	};
	raw_data_dump: {};
};
type WanderersGuideJson = {
	version: 4;
	character: WanderersGuideCharacter;
	content: WanderersGuideContent;
};

function isValidJson(json: any): json is WanderersGuideJson {
	return json && ["version", "character", "content"].every(key => key in json) && json.version === 4;
}
function getOpDataVal<T extends string | number>({ operations }: HasOperations, type: OperationType, variable: OperationDataVariable): T | undefined {
	return operations.find(op => op.type === type && op.data.variable === variable)?.data.value as T ?? 0;
}
function getOpDataAttr({ operations }: HasOperations, type: OperationType, variable: OperationDataVariable): TPathbuilderCharacterAbilityKey | undefined {
	const dataValue = operations.find(op => op.type === type && op.data.variable === variable)?.data.value as { value:string; attribute:string; };
	return dataValue?.attribute.slice(-3).toLowerCase() as TPathbuilderCharacterAbilityKey;
}
function parseEquipment(items: WanderersGuideItem[]) {
	const equipment: TPathbuilderCharacterEquipment[] = [];
	const equipmentContainers: TPathbuilderEquipmentContainers = {};
	const processItem = (item: WanderersGuideItem, parent?: WanderersGuideItem) => {
		if (parent) {
			equipment.push([item.item.name, 1, parent.id, "Invested"]);
		}else {
			equipment.push([item.item.name, 1, "Invested"])
		}
		if (item.container_contents.length) {
			equipmentContainers[item.id] = { containerName:item.item.name, bagOfHolding:false, backpack:false };
			item.container_contents.forEach(child => processItem(child, item));
		}
	};
	items.forEach(item => processItem(item));
	return { equipment, equipmentContainers };
}
function parseWeapon(wpn: WanderersGuideWeapon): TPathbuilderCharacterWeapon {
	return {
		attack: wpn.stats.attack_bonus.total[0],
		damageBonus: wpn.stats.damage.bonus.total,
		damageType: wpn.stats.damage.damageType,
		die: wpn.stats.damage.die,
		display: wpn.item.name,
		extraDamage: [],
		increasedDice: false,
		isInventor: false,
		mat: null,
		name: wpn.item.name,
		pot: wpn.item.meta_data.runes.potency,
		prof: "",
		qty: 1,
		runes: [],
		str: ["", "striking", "greater striking", "major striking"][wpn.item.meta_data.runes.striking] as "" ?? "",
	};
}
function parseArmor(armor: Optional<WanderersGuideArmor>): TPathbuilderCharacterArmor[] {
	if (armor) {
		return [{
			display: armor.item.name,
			mat: null,
			name: armor.item.name,
			pot: armor.item.meta_data.runes.potency,
			prof: "",
			qty: 1,
			res: "",
			runes: [],
			worn: armor.item.is_equipped
		}];
	}
	return [];
}
function parseSpellcasters({ spell_raw_data, spells, spell_sources, focus_spells }: WanderersGuideContent, level: number, abilities: TPathbuilderCharacterAbilities, proficiencies: TPathbuilderCharacterProficiencies): TPathbuilderCharacterSpellCaster[] {
	const spellCasters: TPathbuilderCharacterSpellCaster[] = [];
	const { all } = spells;
	for (const spellSource of spell_sources) {
		const ability = spellSource.source.attribute.slice(-3).toLowerCase() as "str";
		const magicTradition = spellSource.source.tradition.toLowerCase() as "arcane";
		const profKey = `casting${capitalize(magicTradition)}` as "castingArcane";
		const proficiency = proficiencies[profKey] ?? spellSource.stats.spell_dc.total - 10 - level - Ability.scoreToMod(abilities[ability] ?? 10);
		const name = spellSource.source.name.toLowerCase().split(" ").map(capitalize).join(" ");
		const slots = spell_raw_data.slots?.filter(slot => slot.source === spellSource.source.name) ?? [];
		const list = spell_raw_data.list?.filter(spell => spell.source === spellSource.source.name) ?? [];
		const focus = spell_raw_data.focus?.filter(spell => spell.source === spellSource.source.name) ?? [];
		const innate = spell_raw_data.innate?.filter(spell => spell.source === spellSource.source.name) ?? [];
		if (slots.length) {
			const perDay: number[] = [];
			slots.forEach(slot => perDay[slot.rank] = (perDay[slot.rank] ?? 0) + 1);

			const spells: TPathbuilderCharacterSpellCasterSpells[] = [];
			const getSpellRank = (spellLevel: number) => spells[spellLevel] ?? (spells[spellLevel] = { spellLevel, list:[] as string[] });
			list.forEach(spell => {
				const spellRankList = getSpellRank(spell.rank).list;
				const found = all.find(sp => sp.id === spell.spell_id);
				if (!found?.name) {
					debug({ spell, found });
				}else {
					spellRankList.push(found.name);
				}
			});

			spellCasters.push({
				ability,
				blendedSpells: [],
				focusPoints: 0,
				innate: false,
				magicTradition,
				name,
				perDay,
				prepared: [],
				proficiency,
				spellcastingType: /spontaneous/i.test(spellSource.source.type) ? "spontaneous" : "prepared",
				spells,
			});

			// update the proficiencies data
			proficiencies[profKey] = Math.max(proficiencies[profKey] ?? 0, proficiency);
		}
		if (focus.length) {
			const spells: TPathbuilderCharacterSpellCasterSpells[] = [];
			const getSpellRank = (spellLevel: number) => spells[spellLevel] ?? (spells[spellLevel] = { spellLevel, list:[] as string[] });
			focus.forEach(spell => {
				const spellRankList = getSpellRank(spell.rank).list;
				const found = focus_spells.find(sp => sp.id === spell.spell_id)
					?? all.find(sp => sp.id === spell.spell_id);
				if (!found?.name) {
					debug({ spell, found });
				}else {
					spellRankList.push(found.name);
				}
			});

			spellCasters.push({
				ability,
				blendedSpells: [],
				focusPoints: 1,
				innate: false,
				magicTradition: "focus",
				name: `Focus Spells (${name})`,
				perDay: [],
				prepared: [],
				proficiency,
				spellcastingType: "",
				spells,
			});
		}
		if (innate.length) {
			const spells: TPathbuilderCharacterSpellCasterSpells[] = [];
			focus.forEach(spell => (spells[spell.rank] ?? (spells[spell.rank] = { spellLevel:spell.rank, list:[] as string[] }).list.push(all.find(sp => sp.id === spell.spell_id)?.name!)));

			spellCasters.push({
				ability,
				blendedSpells: [],
				focusPoints: 0,
				innate: true,
				magicTradition,
				name: `Innate Spells (${name})`,
				perDay: [],
				prepared: [],
				proficiency,
				spellcastingType: "spontaneous",
				spells,
			});
		}
	}
	return spellCasters;

}
function parseAbilities(content: WanderersGuideContent): TPathbuilderCharacterAbilities {
	return {
		str: 10 + (content.attributes["ATTRIBUTE_STR"].value * 2) + (content.attributes["ATTRIBUTE_STR"].partial ? 2 : 0),
		dex: 10 + (content.attributes["ATTRIBUTE_DEX"].value * 2) + (content.attributes["ATTRIBUTE_DEX"].partial ? 2 : 0),
		con: 10 + (content.attributes["ATTRIBUTE_CON"].value * 2) + (content.attributes["ATTRIBUTE_CON"].partial ? 2 : 0),
		int: 10 + (content.attributes["ATTRIBUTE_INT"].value * 2) + (content.attributes["ATTRIBUTE_INT"].partial ? 2 : 0),
		wis: 10 + (content.attributes["ATTRIBUTE_WIS"].value * 2) + (content.attributes["ATTRIBUTE_WIS"].partial ? 2 : 0),
		cha: 10 + (content.attributes["ATTRIBUTE_CHA"].value * 2) + (content.attributes["ATTRIBUTE_CHA"].partial ? 2 : 0),
	};
}
function parseProficiencies(content: WanderersGuideContent): TPathbuilderCharacterProficiencies {
	const getProfMod = (key: string) => {
		const prof = content?.proficiencies[key.toUpperCase()];
		// if (!prof) debug({key,prof});
		return prof?.parts?.profValue ?? 0;
	}
	const out: Partial<TPathbuilderCharacterProficiencies> & { lore?:number; } = {
		classDC: getProfMod("class_dc"),
		perception: getProfMod("perception"),

		fortitude: getProfMod("save_fort"),
		reflex: getProfMod("save_reflex"),
		will: getProfMod("save_will"),

		heavy: getProfMod("HEAVY_armor"),
		medium: getProfMod("MEDIUM_armor"),
		light: getProfMod("LIGHT_armor"),
		unarmored: getProfMod("unarmored_defense"),

		advanced: getProfMod("advanced_weapons"),
		martial: getProfMod("martial_weapons"),
		simple: getProfMod("simple_weapons"),
		unarmed: getProfMod("unarmed_attacks"),

		// spellcasters use their highest DC post remaster
		castingArcane: getProfMod("spell_dc"),
		castingDivine: getProfMod("spell_dc"),
		castingOccult: getProfMod("spell_dc"),
		castingPrimal: getProfMod("spell_dc"),
	};
	Skill.all().forEach(skill => {
		out[skill.key] = getProfMod(`skill_${skill.name}`);
	});
	return out as TPathbuilderCharacterProficiencies;
}
export function wanderersGuideToPathbuilderJson(json: any): TPathbuilderCharacter | undefined {
	if (isValidJson(json)) {
		const { character, content } = json;
		const { details, level } = character;
		const { size, sizeName } = parseSize(getOpDataVal(details.ancestry, "setValue", "SIZE"));
		const { equipment, equipmentContainers } = parseEquipment(character.inventory.items);
		const abilities = parseAbilities(content);
		const proficiencies = parseProficiencies(content);
		return {
			objectType: "P20Character",
			id: randomSnowflake(),
			name: character.name,
			class: details.class.name,
			dualClass: null,
			level,
			ancestry: details.ancestry.name,
			heritage: content.feats_features?.heritages?.[0]?.name ?? null,
			background: details.background.name,
			gender: [details.info?.gender, details.info?.pronouns].filter(s => s).join("; "),
			age: details.info?.age ?? "",
			deity: details.info?.beliefs ?? "",
			size,
			sizeName,
			keyability: getOpDataAttr(details.class, "setValue", "CLASS_DC")!,
			languages: content.languages.map(lang => capitalize(lang.toLowerCase())),
			attributes: {
				ancestryhp: getOpDataVal(details.ancestry, "setValue", "MAX_HEALTH_ANCESTRY") as number,
				bonushp: getOpDataVal(details.ancestry, "setValue", "MAX_HEALTH_BONUS") as number,
				bonushpPerLevel: 0,
				classhp: getOpDataVal(details.class, "setValue", "MAX_HEALTH_CLASS_PER_LEVEL") as number,
				speed: content.speeds.find(sp => sp.name === "SPEED")?.value.total as number,
				speedBonus: 0,
			},
			abilities,
			proficiencies,
			feats: (content.feats_features?.generalAndSkillFeats ?? [])
				.concat(content.feats_features?.classFeats ?? [])
				.concat(content.feats_features?.ancestryFeats ?? [])
				.concat(content.feats_features?.otherFeats ?? [])
				.map(f => [f.name, null, f.type, f.level]),
			specials: [],
			lores: Object.keys(content.proficiencies)
						.filter(key => key.startsWith("SKILL_LORE") && key !== "SKILL_LORE____")
						.map(key => ([key.split("_").slice(2).filter(s => s.trim()).map(lore => capitalize(lore.toLowerCase())).join(" "), content.proficiencies[key].parts.profValue])),
			equipment,
			equipmentContainers,
			specificProficiencies: {
				trained: [],
				expert: [],
				master: [],
				legendary: [],
			},
			weapons: content.weapons.map(parseWeapon),
			money: {
				pp: +character.inventory.coins.pp || 0,
				gp: +character.inventory.coins.gp || 0,
				sp: +character.inventory.coins.sp || 0,
				cp: +character.inventory.coins.cp || 0,
			},
			armor: parseArmor(content.armor_item),//TPathbuilderCharacterArmor[];
			spellCasters: parseSpellcasters(content, level, abilities, proficiencies),
			formula: [],//TPathbuilderCharacterFormula[];
			pets: [],//TPathbuilderCharacterPet[];
			acTotal: {
				acProfBonus: 0,
				acAbilityBonus: 0,// ?? getAbility("dex")
				acItemBonus: content.armor_item?.item?.meta_data?.ac_bonus ?? 0,
				acTotal: content.ac,// ??
			},
		};
	}
	return undefined;
}