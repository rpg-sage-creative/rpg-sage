import { registerObject } from "../data/Repository";
import type Base from "../model/base/Base";
import type { BaseCore } from "../model/base/Base";
import Action from "./Action";
import Activity from "./Activity";
import AlchemicalItem from "./AlchemicalItem";
import Ammunition from "./Ammunition";
import Ancestry from "./Ancestry";
import ArcaneSchool from "./ArcaneSchool";
import Archetype from "./Archetype";
import Armor from "./Armor";
import ArmorGroup from "./ArmorGroup";
import Background from "./Background";
import Class from "./Class";
import ClassKit from "./ClassKit";
import ClassPath from "./ClassPath";
import Condition from "./Condition";
import DedicationFeat from "./DedicationFeat";
import Deity from "./Deity";
import Domain from "./Domain";
import Feat from "./Feat";
import FocusSpell from "./FocusSpell";
import Gear from "./Gear";
import GearCategory from "./GearCategory";
import Glossary from "./Glossary";
import HasFaith from "./HasFaith";
import Heritage from "./Heritage";
import Item from "./Item";
import Language from "./Language";
import Material from "./Material";
import Ritual from "./Ritual";
import Rule from "./Rule";
import Shield from "./Shield";
import Skill from "./Skill";
import Snare from "./Snare";
import Spell, { type SpellCore } from "./Spell";
import Table from "./Table";
import Trait from "./Trait";
import VersatileHeritage from "./VersatileHeritage";
import Weapon from "./Weapon";
import WeaponGroup from "./WeaponGroup";

export type TCore<T extends string> =
	T extends "Spell" ? SpellCore
	: BaseCore

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
	: T extends "HasFaith" ? HasFaith
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

export default function register(): void {
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
	registerObject(HasFaith);
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