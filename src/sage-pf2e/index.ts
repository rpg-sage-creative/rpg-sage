import { loadData } from "./data/Repository.js";
import { registerObjects } from "./model/index.js";
import { registerBaseObjects } from "./model/base/index.js";
import { registerBestiaryObjects } from "./model/bestiary/index.js";

//#region data
export { RenderableContent } from "./data/RenderableContent.js";
export * as Repository from "./data/Repository.js";
//#endregion

//#region model
//#region model/base
export { Base, type BaseCore } from "./model/base/Base.js";
export { HasSource, type SourcedCore, type TSourceInfo, type TSourceInfoRaw } from "./model/base/HasSource.js";
export { Source, type SourceCore } from "./model/base/Source.js";
export { SourceNotationMap } from "./model/base/SourceNotationMap.js";
export * from "./model/base/interfaces.js";
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