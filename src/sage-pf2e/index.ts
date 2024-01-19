import { loadData } from "./data/Repository";
import { registerObjects } from "./model";
import { registerBaseObjects } from "./model/base";
import { registerBestiaryObjects } from "./model/bestiary";

//#region data
export { RenderableContent } from "./data/RenderableContent";
export * as Repository from "./data/Repository";
//#endregion

//#region map
export * from "./map/map";
//#endregion

//#region model
//#region model/base
export { Base, BaseCore } from "./model/base/Base";
export { HasSource, SourcedCore, TSourceInfo, TSourceInfoRaw } from "./model/base/HasSource";
export { Source, SourceCore } from "./model/base/Source";
export { SourceNotationMap } from "./model/base/SourceNotationMap";
export * from "./model/base/interfaces";
//#endregion

//#region model/bestiary
export { Creature } from "./model/bestiary/Creature";
export { CreatureCategory, CreatureCategoryCore, IHasLevelAndName, sortByLevelThenName } from "./model/bestiary/CreatureCategory";
export { CreatureLanguages } from "./model/bestiary/CreatureLanguages";
export * from "./model/bestiary/ICreature";
//#endregion

//#region model/pc
export { Abilities, IHasAbilities } from "./model/pc/Abilities";
export { ArmorClasses } from "./model/pc/ArmorClasses";
export { Check, TCheckPlayerCharacter } from "./model/pc/Check";
export { Encumbrance } from "./model/pc/Encumbrance";
export { Equipment, IEquipment } from "./model/pc/Equipment";
export { EquipmentItem, EquipmentItemCore } from "./model/pc/EquipmentItem";
export { EquipmentList, EquipmentListCore } from "./model/pc/EquipmentList";
export { PathbuilderCharacter, TPathbuilderCharacter, TPathbuilderCharacterAbilityKey } from "./model/pc/PathbuilderCharacter";
export { IHasProficiencies, PlayerCharacter, PlayerCharacterCore } from "./model/pc/PlayerCharacter";
export { IHasSavingThrows, SavingThrows } from "./model/pc/SavingThrows";
export { Skills } from "./model/pc/Skills";
export { Speeds } from "./model/pc/Speeds";
//#endregion

//#region model/.
export { Action, ActionCore } from "./model/Action";
export { Activity, ActivityCore } from "./model/Activity";
export { AlchemicalItem, AlchemicalItemCore } from "./model/AlchemicalItem";
export { Ammunition, AmmunitionCore } from "./model/Ammunition";
export { Ancestry } from "./model/Ancestry";
export { ArcaneSchool } from "./model/ArcaneSchool";
export { Archetype } from "./model/Archetype";
export { Armor } from "./model/Armor";
export { ArmorGroup } from "./model/ArmorGroup";
export { Background } from "./model/Background";
export { Class } from "./model/Class";
export { ClassKit } from "./model/ClassKit";
export { ClassPath } from "./model/ClassPath";
export { Coins, CoinsCore } from "./model/Coins";
export { Condition } from "./model/Condition";
export { DedicationFeat } from "./model/DedicationFeat";
export { Deity } from "./model/Deity";
export { Domain } from "./model/Domain";
export { Faith } from "./model/Faith";
export { Feat } from "./model/Feat";
export { FocusSpell } from "./model/FocusSpell";
export { Gear } from "./model/Gear";
export { GearCategory } from "./model/GearCategory";
export { Glossary } from "./model/Glossary";
export { Heritage } from "./model/Heritage";
export { Item } from "./model/Item";
export { Language } from "./model/Language";
export { Material } from "./model/Material";
export { Ritual } from "./model/Ritual";
export { Rule } from "./model/Rule";
export { Shield } from "./model/Shield";
export { Skill } from "./model/Skill";
export { Snare } from "./model/Snare";
export { Spell } from "./model/Spell";
export { Table } from "./model/Table";
export { Trait } from "./model/Trait";
export { VersatileHeritage } from "./model/VersatileHeritage";
export { Weapon } from "./model/Weapon";
export { WeaponGroup } from "./model/WeaponGroup";
export { TCore, TEntity } from "./model/index";
//#endregion
//#endregion

//#region weather
export { WeatherCalendar, WeatherCalendarCore } from "./weather/WeatherCalendar";
export { IWeatherDayResult, IWeatherHourResult, WeatherGenerator } from "./weather/WeatherGenerator";
export * from "./weather/tables";
export * from "./weather/terms";
export * from "./weather/weather";
//#endregion

export * from "./common";

export function registerAndLoad(): Promise<void> {
	registerBaseObjects();
	registerBestiaryObjects();
	registerObjects();
	return loadData();
}