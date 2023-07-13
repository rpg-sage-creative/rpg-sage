//#region import
import { registerObject } from "../data";
import type { Base, BaseCore } from "../model/base/Base";
import { Action, type ActionCore } from "./Action";
import { Activity, type ActivityCore } from "./Activity";
import { AlchemicalItem, type AlchemicalItemCore } from "./AlchemicalItem";
import { Ammunition, type AmmunitionCore } from "./Ammunition";
import { Ancestry, type AncestryCore } from "./Ancestry";
import { ArcaneSchool, type ArcaneSchoolCore } from "./ArcaneSchool";
import { Archetype, type ArchetypeCore } from "./Archetype";
import { Armor, type ArmorCore } from "./Armor";
import { ArmorGroup, type ArmorGroupCore } from "./ArmorGroup";
import { Background, type BackgroundCore } from "./Background";
import { Class, type ClassCore } from "./Class";
import { ClassKit, type ClassKitCore } from "./ClassKit";
import { ClassPath, type ClassPathCore } from "./ClassPath";
import { Condition, type ConditionCore } from "./Condition";
import { DedicationFeat } from "./DedicationFeat";
import { Deity, type DeityCore } from "./Deity";
import { Domain, type DomainCore } from "./Domain";
import { Faith, type FaithCore } from "./Faith";
import { Feat, type FeatCore } from "./Feat";
import { FocusSpell, type FocusSpellCore } from "./FocusSpell";
import { Gear, type GearCore } from "./Gear";
import { GearCategory } from "./GearCategory";
import { Glossary, type GlossaryCore } from "./Glossary";
import { Heritage, type HeritageCore } from "./Heritage";
import { Item, type ItemCore } from "./Item";
import { Language, type LanguageCore } from "./Language";
import { Material, type MaterialCore } from "./Material";
import { Ritual, type RitualCore } from "./Ritual";
import { Rule, type RuleCore } from "./Rule";
import { Shield, type ShieldCore } from "./Shield";
import { Skill, type SkillCore } from "./Skill";
import { Snare, type SnareCore } from "./Snare";
import { Spell, type SpellCore } from "./Spell";
import { Table, type TableCore } from "./Table";
import { Trait } from "./Trait";
import { VersatileHeritage, type VersatileHeritageCore } from "./VersatileHeritage";
import { Weapon, type WeaponCore } from "./Weapon";
import { WeaponGroup, type WeaponGroupCore } from "./WeaponGroup";
import type { SourcedCore } from "./base/HasSource";
//#endregion

//#region TCore
export type TCore<T extends string> =
	T extends "Action" ? ActionCore
	: T extends "Activity" ? ActivityCore
	: T extends "AlchemicalItem" ? AlchemicalItemCore
	: T extends "Ammunition" ? AmmunitionCore
	: T extends "Ancestry" ? AncestryCore
	: T extends "ArcaneSchool" ? ArcaneSchoolCore
	: T extends "Archetype" ? ArchetypeCore
	: T extends "Armor" ? ArmorCore
	: T extends "ArmorGroup" ? ArmorGroupCore
	: T extends "Background" ? BackgroundCore
	: T extends "Class" ? ClassCore
	: T extends "ClassKit" ? ClassKitCore
	: T extends "ClassPath" ? ClassPathCore
	: T extends "Condition" ? ConditionCore
	: T extends "DedicationFeat" ? FeatCore<"DedicationFeat">
	: T extends "Deity" ? DeityCore
	: T extends "Domain" ? DomainCore
	: T extends "Feat" ? FeatCore
	: T extends "FocusSpell" ? FocusSpellCore
	: T extends "Gear" ? GearCore
	: T extends "GearCategory" ? SourcedCore<"GearCategory">
	: T extends "Glossary" ? GlossaryCore
	: T extends "Faith" ? FaithCore
	: T extends "Heritage" ? HeritageCore
	: T extends "Item" ? ItemCore
	: T extends "Language" ? LanguageCore
	: T extends "Material" ? MaterialCore
	: T extends "Ritual" ? RitualCore
	: T extends "Rule" ? RuleCore
	: T extends "Shield" ? ShieldCore
	: T extends "Skill" ? SkillCore
	: T extends "Snare" ? SnareCore
	: T extends "Spell" ? SpellCore
	: T extends "Table" ? TableCore
	: T extends "Trait" ? SourcedCore<"Trait">
	: T extends "VersatileHeritage" ? VersatileHeritageCore
	: T extends "Weapon" ? WeaponCore
	: T extends "WeaponGroup" ? WeaponGroupCore
	: BaseCore
//#endregion

//#region TEntity
export type TEntity<T extends string> =
	T extends "Action" ? Action
	: T extends "Activity" ? Activity
	: T extends "AlchemicalItem" ? AlchemicalItem
	: T extends "Ammunition" ? Ammunition
	: T extends "Ancestry" ? Ancestry
	: T extends "ArcaneSchool" ? ArcaneSchool
	: T extends "Archetype" ? Archetype
	: T extends "Armor" ? Armor
	: T extends "ArmorGroup" ? ArmorGroup
	: T extends "Background" ? Background
	: T extends "Class" ? Class
	: T extends "ClassKit" ? ClassKit
	: T extends "ClassPath" ? ClassPath
	: T extends "Condition" ? Condition
	: T extends "DedicationFeat" ? DedicationFeat
	: T extends "Deity" ? Deity
	: T extends "Domain" ? Domain
	: T extends "Feat" ? Feat
	: T extends "FocusSpell" ? FocusSpell
	: T extends "Gear" ? Gear
	: T extends "GearCategory" ? GearCategory
	: T extends "Glossary" ? Glossary
	: T extends "Faith" ? Faith
	: T extends "Heritage" ? Heritage
	: T extends "Item" ? Item
	: T extends "Language" ? Language
	: T extends "Material" ? Material
	: T extends "Ritual" ? Ritual
	: T extends "Rule" ? Rule
	: T extends "Shield" ? Shield
	: T extends "Skill" ? Skill
	: T extends "Snare" ? Snare
	: T extends "Spell" ? Spell
	: T extends "Table" ? Table
	: T extends "Trait" ? Trait
	: T extends "VersatileHeritage" ? VersatileHeritage
	: T extends "Weapon" ? Weapon
	: T extends "WeaponGroup" ? WeaponGroup
	: Base;

export function register(): void {
	registerObject(Action);
	registerObject(Activity);
	registerObject(AlchemicalItem);
	registerObject(Ammunition);
	registerObject(Ancestry);
	registerObject(ArcaneSchool);
	registerObject(Archetype);
	registerObject(Armor);
	registerObject(ArmorGroup);
	registerObject(Background);
	registerObject(Class);
	registerObject(ClassKit);
	registerObject(ClassPath);
	registerObject(Condition);
	registerObject(DedicationFeat);
	registerObject(Deity);
	registerObject(Domain);
	registerObject(Feat);
	registerObject(FocusSpell);
	registerObject(Gear);
	registerObject(GearCategory);
	registerObject(Glossary);
	registerObject(Faith);
	registerObject(Heritage);
	registerObject(Item);
	registerObject(Language);
	registerObject(Material);
	registerObject(Ritual);
	registerObject(Rule);
	registerObject(Shield);
	registerObject(Skill);
	registerObject(Snare);
	registerObject(Spell);
	registerObject(Table);
	registerObject(Trait);
	registerObject(VersatileHeritage);
	registerObject(Weapon);
	registerObject(WeaponGroup);
}
//#endregion

//#region exports
export * from "./pc";
export { HasSource, Source, SourceNotationMap } from "./base";
//#endregion