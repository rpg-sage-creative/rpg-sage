import { loadData } from "./data/Repository";
import registerObjects from "./model";
import registerBaseObjects from "./model/base";
import registerBestiaryObjects from "./model/bestiary";

//#region cal
export * from "./cal/cal";
export { default as GDate } from "./cal/GDate";
//#endregion

//#region data
export * from "./data/consts";
export { default as RenderableContent } from "./data/RenderableContent";
export * as Repository from "./data/Repository";
export { default as ScoredMenu, IMenuRenderable } from "./data/ScoredMenu";
export { default as SearchResults } from "./data/SearchResults";
export * as Pf2Tools from "./data/Pf2ToolsData";
//#endregion

//#region map
export * from "./map/map";
//#endregion

//#region model
//#region model/base
export { default as Base, BaseCore } from "./model/base/Base";
export { default as HasSource, TSourceInfoRaw, TSourceInfo, SourcedCore } from "./model/base/HasSource";
export * from "./model/base/interfaces";
export { default as Source, SourceCore } from "./model/base/Source";
export { default as SourceNotationMap } from "./model/base/SourceNotationMap";
//#endregion

//#region model/bestiary
export { default as Creature } from "./model/bestiary/Creature";
export { default as CreatureCategory, IHasLevelAndName, sortByLevelThenName, CreatureCategoryCore } from "./model/bestiary/CreatureCategory";
export { default as CreatureLanguages } from "./model/bestiary/CreatureLanguages";
export * from "./model/bestiary/ICreature";
//#endregion

//#region model/pc
export { default as Abilities, IHasAbilities } from "./model/pc/Abilities";
export { default as ArmorClasses } from "./model/pc/ArmorClasses";
export { default as Check, TCheckPlayerCharacter } from "./model/pc/Check";
export { default as Encumbrance } from "./model/pc/Encumbrance";
export { default as Equipment, IEquipment } from "./model/pc/Equipment";
export { default as EquipmentItem, EquipmentItemCore } from "./model/pc/EquipmentItem";
export { default as EquipmentList, EquipmentListCore } from "./model/pc/EquipmentList";
export { default as PathbuilderCharacter, TPathbuilderCharacter, TPathbuilderCharacterAbilityKey } from "./model/pc/PathbuilderCharacter";
export { default as PlayerCharacter, PlayerCharacterCore, IHasProficiencies } from "./model/pc/PlayerCharacter";
export { default as SavingThrows, IHasSavingThrows } from "./model/pc/SavingThrows";
export { default as Skills } from "./model/pc/Skills";
export { default as Speeds } from "./model/pc/Speeds";
//#endregion

//#region model/.
export { TCore, TEntity } from "./model/index";
export { default as Action, ActionCore } from "./model/Action";
export { default as Activity, ActivityCore } from "./model/Activity";
export { default as AlchemicalItem, AlchemicalItemCore } from "./model/AlchemicalItem";
export { default as Ammunition, AmmunitionCore } from "./model/Ammunition";
export { default as Ancestry } from "./model/Ancestry";
export { default as ArcaneSchool } from "./model/ArcaneSchool";
export { default as Archetype } from "./model/Archetype";
export { default as Armor } from "./model/Armor";
export { default as ArmorGroup } from "./model/ArmorGroup";
export { default as Background } from "./model/Background";
export { default as Class } from "./model/Class";
export { default as ClassKit } from "./model/ClassKit";
export { default as ClassPath } from "./model/ClassPath";
export { default as Coins, CoinsCore } from "./model/Coins";
export { default as Condition } from "./model/Condition";
export { default as DedicationFeat } from "./model/DedicationFeat";
export { default as Deity } from "./model/Deity";
export { default as Domain } from "./model/Domain";
export { default as Feat } from "./model/Feat";
export { default as FocusSpell } from "./model/FocusSpell";
export { default as Gear } from "./model/Gear";
export { default as GearCategory } from "./model/GearCategory";
export { default as Glossary } from "./model/Glossary";
export { default as HasFaith } from "./model/HasFaith";
export { default as Heritage } from "./model/Heritage";
export { default as Item } from "./model/Item";
export { default as Language } from "./model/Language";
export { default as Material } from "./model/Material";
export { default as Ritual } from "./model/Ritual";
export { default as Rule } from "./model/Rule";
export { default as Shield } from "./model/Shield";
export { default as Skill } from "./model/Skill";
export { default as Snare } from "./model/Snare";
export { default as Spell } from "./model/Spell";
export { default as Table } from "./model/Table";
export { default as Trait } from "./model/Trait";
export { default as VersatileHeritage } from "./model/VersatileHeritage";
export { default as Weapon } from "./model/Weapon";
export { default as WeaponGroup } from "./model/WeaponGroup";
//#endregion
//#endregion

//#region weather
export * from "./weather/tables";
export * from "./weather/terms";
export * from "./weather/weather";
export { WeatherCalendarCore, default as WeatherCalendar } from "./weather/WeatherCalendar";
export { IWeatherDayResult, IWeatherHourResult, default as WeatherGenerator } from "./weather/WeatherGenerator";
//#endregion

export * from "./common";

export function registerAndLoad(pf2DataPath: string, includePf2ToolsData = false): Promise<void> {
	registerBaseObjects();
	registerBestiaryObjects();
	registerObjects();
	return loadData(pf2DataPath, includePf2ToolsData);
}