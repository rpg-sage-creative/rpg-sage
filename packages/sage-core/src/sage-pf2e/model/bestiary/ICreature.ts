import type {
	IAbilityModifiers, IAttack, IAura, IGenericBlock, IPoison, ISourceReference,
	TCasterType, TMagicTradition, TSpeedType
} from "../../common.js";
import type { ActionCore } from "../Action.js";
import type { SourcedCore } from "../base/HasSource.js";

export interface ICreaturePerception {
	value: number;
	traits: string[];
}
export interface ICreatureTrainedSkill {
	name: string;
	value: number;
	qualifier?: string;
}
export interface ICreatureSkills {
	untrained: number;
	trained: ICreatureTrainedSkill[];
}
export interface ICreatureAcTac {
	ac: number;
	acSpecial: string;
	/*
	// tac: number;
	// tacSpecial: string;
	*/
	special: string;
}
export interface ICreatureSavingThrows {
	fort: number;
	fortSpecial: string;
	ref: number;
	refSpecial: string;
	will: number;
	willSpecial: string;
	special: string;
}
export interface ICreatureHp {
	hp: number;
	hpSpecial: string;
	hardness?: number;
	hardnessSpecial?: string;
}
export interface ICreatureSpellLevel {
	level: number;
	slots?: number;
	spells: string[];
}
export interface ICreatureSpeed {
	type?: TSpeedType;
	value: number;
	special?: string;
}
export interface ICreatureSpells {
	tradition: TMagicTradition;
	type: TCasterType;
	dc: number;
	attack?: number;
	levels: ICreatureSpellLevel[];
}
export interface ICreatureLanguages {
	languages: string[];
	special?: string;
}
export type IOtherBlock = IGenericBlock | ActionCore | IAura | IPoison;
export interface ICreature extends SourcedCore<"Creature"> {
	fullName: string;
	/*
	// details: string[];
	// description: string;
	*/
	reference: ISourceReference;

	/*
	// name: string;
	// nameLower: string;
	// rarity: TRarity;
	// objectType: "Creature";
	*/
	level: number;

	// traits: string[];

	perception: ICreaturePerception;
	languages: ICreatureLanguages;
	skills: ICreatureSkills;
	abilityModifiers: IAbilityModifiers;
	items: string[];
	interactive: IOtherBlock[];

	acTac: ICreatureAcTac;
	savingThrows: ICreatureSavingThrows;
	hp: ICreatureHp;
	immunities: string[];
	resistances: string[];
	weaknesses: string[];
	defensive: IOtherBlock[];

	speed: ICreatureSpeed[];
	attacks: IAttack[];
	spells: ICreatureSpells[];
	offensive: IOtherBlock[];
}
