import { loadData } from "./data/Repository.js";
import { registerObjects } from "./model/index.js";
import { registerBaseObjects } from "./model/base/index.js";
import { registerBestiaryObjects } from "./model/bestiary/index.js";

//#region data
export { RenderableContent } from "./data/RenderableContent.js";
export * as Repository from "./data/Repository.js";
//#endregion

//#region map
export * from "./map/map.js";
//#endregion

//#region model
//#region model/base
export { Base, type BaseCore } from "./model/base/Base.js";
export { HasSource, type SourcedCore, type TSourceInfo, type TSourceInfoRaw } from "./model/base/HasSource.js";
export { Source, type SourceCore } from "./model/base/Source.js";
export { SourceNotationMap } from "./model/base/SourceNotationMap.js";
export * from "./model/base/interfaces.js";
//#endregion

//#region model/bestiary
export { Creature } from "./model/bestiary/Creature.js";
export { CreatureCategory, type CreatureCategoryCore, type IHasLevelAndName, sortByLevelThenName } from "./model/bestiary/CreatureCategory.js";
export { CreatureLanguages } from "./model/bestiary/CreatureLanguages.js";
export * from "./model/bestiary/ICreature.js";
//#endregion

//#region model/pc
export { Abilities, type IHasAbilities } from "./model/pc/Abilities.js";
export { ArmorClasses } from "./model/pc/ArmorClasses.js";
export { Check, type TCheckPlayerCharacter } from "./model/pc/Check.js";
export { Encumbrance } from "./model/pc/Encumbrance.js";
export { Equipment, type IEquipment } from "./model/pc/Equipment.js";
export { EquipmentItem, type EquipmentItemCore } from "./model/pc/EquipmentItem.js";
export { EquipmentList, type EquipmentListCore } from "./model/pc/EquipmentList.js";
export { PathbuilderCharacter, type TPathbuilderCharacter, type TPathbuilderCharacterAbilityKey } from "./model/pc/PathbuilderCharacter.js";
export { type IHasProficiencies, PlayerCharacter, type PlayerCharacterCore } from "./model/pc/PlayerCharacter.js";
export { type IHasSavingThrows, SavingThrows } from "./model/pc/SavingThrows.js";
export { Skills } from "./model/pc/Skills.js";
export { Speeds } from "./model/pc/Speeds.js";
//#endregion

//#region model/.
export { Action, type ActionCore } from "./model/Action.js";
export { Activity, type ActivityCore } from "./model/Activity.js";
export { AlchemicalItem, type AlchemicalItemCore } from "./model/AlchemicalItem.js";
export { Ammunition, type AmmunitionCore } from "./model/Ammunition.js";
export { Ancestry } from "./model/Ancestry.js";
export { ArcaneSchool } from "./model/ArcaneSchool.js";
export { Archetype } from "./model/Archetype.js";
export { Armor } from "./model/Armor.js";
export { ArmorGroup } from "./model/ArmorGroup.js";
export { Background } from "./model/Background.js";
export { Class } from "./model/Class.js";
export { ClassKit } from "./model/ClassKit.js";
export { ClassPath } from "./model/ClassPath.js";
export { Coins, type CoinsCore } from "./model/Coins.js";
export { Condition } from "./model/Condition.js";
export { DedicationFeat } from "./model/DedicationFeat.js";
export { Deity } from "./model/Deity.js";
export { Domain } from "./model/Domain.js";
export { Faith } from "./model/Faith.js";
export { Feat } from "./model/Feat.js";
export { FocusSpell } from "./model/FocusSpell.js";
export { Gear } from "./model/Gear.js";
export { GearCategory } from "./model/GearCategory.js";
export { Glossary } from "./model/Glossary.js";
export { Heritage } from "./model/Heritage.js";
export { Item } from "./model/Item.js";
export { Language } from "./model/Language.js";
export { Material } from "./model/Material.js";
export { Ritual } from "./model/Ritual.js";
export { Rule } from "./model/Rule.js";
export { Shield } from "./model/Shield.js";
export { Skill } from "./model/Skill.js";
export { Snare } from "./model/Snare.js";
export { Spell } from "./model/Spell.js";
export { Table } from "./model/Table.js";
export { Trait } from "./model/Trait.js";
export { VersatileHeritage } from "./model/VersatileHeritage.js";
export { Weapon } from "./model/Weapon.js";
export { WeaponGroup } from "./model/WeaponGroup.js";
export { type TCore, type TEntity } from "./model/index.js";
//#endregion
//#endregion

//#region weather
export { WeatherCalendar, type WeatherCalendarCore } from "./weather/WeatherCalendar.js";
export { type IWeatherDayResult, type IWeatherHourResult, WeatherGenerator } from "./weather/WeatherGenerator.js";
export * from "./weather/tables.js";
export * from "./weather/terms.js";
export * from "./weather/weather.js";
//#endregion

export * from "./common.js";

export function registerAndLoad(): Promise<void> {
	registerBaseObjects();
	registerBestiaryObjects();
	registerObjects();
	return loadData();
}