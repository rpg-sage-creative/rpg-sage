import type { Core } from "../../sage-utils/ClassUtils";
import { nth } from "../../sage-utils/NumberUtils";
import type { SearchInfo, SearchScore } from "../../sage-utils/SearchUtils";
import { capitalize } from "../../sage-utils/StringUtils";
import type { UUID } from "../../sage-utils/UuidUtils";
import type { TMagicComponent, TMagicTradition } from '../common';
import { ABILITIES, NEWLINE, toModifier } from '../common';
import { Pf2eRenderableContent } from '../Pf2eRenderableContent';
import { findByType, findByValue } from '../data';
import type { ArcaneSchool } from './ArcaneSchool';
import type { SourcedCore } from "./base/HasSource";
import { HasSource } from './base/HasSource';
import type { Domain } from './Domain';
import { HeightenedSpell } from "./HeightenedSpell";
import type { RenderableContent } from "../../sage-utils/RenderUtils";
import { isUnique } from "../../sage-utils/ArrayUtils";
import { TSpellAffliction, TSpellReaction } from "./Spell";

//#region types

type FoundrySystemBase = {

};

type FoundryBase = {
	_id: string;
	img: string;
	name: string;
	system: FoundrySystemBase;
	type: string;
};

type FoundryValue<T> = null | { value:T; };

type FoundrySpellDamage = {
	applyMod: boolean;
	type: { categories:[]; subtype:string; value:string; };
	value: string;
};

type FoundrySpellSystem = FoundrySystemBase & {
	ability?: FoundryValue<string>;
	area?: FoundryValue<{ details?:string; type:string; value:number; }>;
areatype: any;
	category: FoundryValue<"focus"|"ritual"|"spell">;
	components: { focus:boolean; material:boolean; somatic:boolean; verbal:boolean; };
	cost?: FoundryValue<string>;
	damage: FoundryValue<{ [key: string]: FoundrySpellDamage; }>;
damagetype: any;
	description: FoundryValue<string>;
	duration: FoundryValue<string>;
	hasCounteractCheck: FoundryValue<boolean>;
	heightening: { damage:{ [key:string]: string; }; interval:number; type:"interval"; };
	level: FoundryValue<number>;
	materials: FoundryValue<string>;
overlays: any;
	prepared: FoundryValue<boolean>;
	primarycheck: FoundryValue<string>;
	range: FoundryValue<string>;
rarity: FoundryValue<"common">;
	rules: [];
	save: { basic:string; value:string; };
secondarycasters: any;
secondarycheck: any;
source: any;
spellCategorie: any;
spellType: any;
sustained: any;
target: any;
time: any;
traditions: any;
traits: any;
usage: any;
};

type FoundrySpellCore = FoundryBase & {
	system: FoundrySpellSystem;
	type: "spell";
};

//#endregion

//#region interfaces

// export interface SpellCoreBase<T extends string = string> extends SourcedCore<T> {
// 	affliction?: TSpellAffliction;
// 	archetype?: string;
// 	area?: string;
// 	cast: string;
// 	components?: TSpellComponent[];
// 	cost?: string;
// 	creature?: TSpellCreature;
// 	domain?: string;
// 	duration?: string;
// 	focus: boolean;
// 	heightened?: TSpellHeighten[];
// 	heightenedAs?: string[];
// 	level: number;
// 	mystery?: string;
// 	range?: string;
// 	reaction?: TSpellReaction;
// 	requirements?: string;
// 	savingThrow?: string;
// 	targets?: string;
// 	traditions: TMagicTradition[];
// 	trigger?: string;
// }

// export type SpellCore = SpellCoreBase<"Spell">;

// export interface HeightenedSpellCore extends Core<"HeightenedSpell"> {
// 	bumps: number;
// 	change?: string;
// 	level: number;
// 	spell: UUID;
// }

//#endregion

export class FoundrySpell<T extends string = "Spell", U extends FoundrySpellCore = FoundrySpellCore> extends HasSource<U, T> {
	public constructor(core: U) {
		super(core);
		/*
		// if (core.focus) {
		// 	let className = this.traits.find(trait => ClassNames.includes(trait));
		// 	let archetypeName = ArchetypeNames.find(archetype => archetype === this.core.archetype);
		// 	this.id = createId(core.objectType, archetypeName || className, core.name, core.source);
		// }
		// this.heightened = heightenSpell(this.id, core);
		*/
	}

	//#region properties

	public get affliction(): TSpellAffliction | undefined { return this.core.affliction; }
	private _arcaneSchool?: ArcaneSchool | null;
	public get arcaneSchool(): ArcaneSchool | undefined {
		if (this._arcaneSchool === undefined) {
			for (const trait of this.traits) {
				const arcaneSchool = findByValue("ArcaneSchool", trait);
				if (arcaneSchool) {
					this._arcaneSchool = arcaneSchool;
					break;
				}
			}
		}
		return this._arcaneSchool ?? undefined;
	}
	public get archetypeName(): string | undefined { return this.core.archetype; }
	public get area(): string | undefined { return this.core.area; }
	public canHeighten = (this.core.heightenedAs ?? this.core.heightened ?? []).length > 0;
	public get cast(): string { return this.core.cast; }
	public components = <TMagicComponent[]>(this.core.components ?? []).map(component => capitalize(component));
	public get cost(): string | undefined { return this.core.cost; }
	private _domain?: Domain | null;
	public get domain(): Domain | undefined {
		if (this._domain === undefined) {
			this._domain = (this.core.domain ? findByValue("Domain", this.core.domain) : null)
				?? findByType("Domain", (domain: Domain) => domain.toJSON().spells.includes(this.name))
				?? null;
		}
		return this._domain ?? undefined;
	}
	public get domainName(): string | undefined { return this.core.domain; }
	public get duration(): string | undefined { return this.core.duration; }
	// public heightened: HeightenedSpell[];
	public get isCantrip(): boolean { return this.traits.includes("Cantrip"); }
	public isFocus = false;
	public get level(): number { return this.core.level ?? 0; }
	public get mystery(): string | undefined { return this.core.mystery; }
	public get range(): string | undefined { return this.core.range; }
	public get reaction(): TSpellReaction | undefined { return this.core.reaction; }
	public get requirements(): string | undefined { return this.core.requirements; }
	public get savingThrow(): string | undefined { return this.core.savingThrow; }
	public get targets(): string | undefined { return this.core.targets; }
	public traditions = <TMagicTradition[]>(this.core.traditions || []).map(tradition => capitalize(tradition));
	public get trigger(): string | undefined { return this.core.trigger; }

	//#endregion

	//#region instance methods

	public toHeightenedSpell(): HeightenedSpell;
	public toHeightenedSpell(level: number): HeightenedSpell;
	public toHeightenedSpell(level = this.level): HeightenedSpell {
		return heightenSpell(this.id, this.core as SpellCore).find(h => h.level === level)!;
		/*// return this.heightened.find(h => h.level === level);*/
	}

	//#endregion

	//#region IRenderable
	private toRenderableContentTitle(content: RenderableContent): void {
		const cantrip = this.isCantrip ? " Cantrip" : "";
		const focus = !this.isCantrip && this.isFocus ? " Focus" : "";
		const spell = !this.isCantrip && !this.isFocus ? " Spell" : "";
		const title = `<b>${this.name}</b> - ${cantrip}${focus}${spell} ${this.level}`;
		content.setTitle(title);
	}
	private toRenderableContentTraditionsDomainMystery(): string[] {
		const description: string[] = [];
		if (this.traditions.length) {
			description.push(`<b>Traditions</b> ${this.traditions.map(t => t.toLowerCase()).join(", ")}`);
		}
		if (this.domain) {
			description.push(`<b>Domain</b> ${this.domain.nameLower}`);
		}
		if (this.mystery) {
			description.push(`<b>Mystery</b> ${this.mystery}`);
		}
		return description;
	}
	private toRenderableContentCastTriggerCostRequirements(): string {
		const castTriggerCostRequirements: string[] = [];
		if (this.components.length) {
			const parentheses = !(this.cast.startsWith("[") && this.cast.endsWith("]"));
			castTriggerCostRequirements.push(`<b>Cast</b> ${this.cast} ${parentheses && "(" || ""}${this.components.map(c => c.toLowerCase()).join(", ")}${parentheses && ")" || ""}`);
		} else {
			castTriggerCostRequirements.push(`<b>Cast</b> ${this.cast}`);
		}
		if (this.trigger) {
			castTriggerCostRequirements.push(`<b>Trigger</b> ${this.trigger}`);
		}
		if (this.cost) {
			castTriggerCostRequirements.push(`<b>Cost</b> ${this.cost}`);
		}
		if (this.requirements) {
			castTriggerCostRequirements.push(`<b>Requirements</b> ${this.requirements}`);
		}
		return castTriggerCostRequirements.join("; ");
	}
	private toRenderableContentRangeAreaTargets(): string {
		const rangeAreaTargets: string[] = [];
		if (this.range) {
			rangeAreaTargets.push(`<b>Range</b> ${this.range}`);
		}
		if (this.area) {
			rangeAreaTargets.push(`<b>Area</b> ${this.area}`);
		}
		if (this.targets) {
			rangeAreaTargets.push(`<b>Targets</b> ${this.targets}`);
		}
		return rangeAreaTargets.join("; ");
	}
	private toRenderableContentSavingThrowDuration(): string {
		const savingThrowDuration: string[] = [];
		if (this.savingThrow) {
			savingThrowDuration.push(`<b>Saving Throw</b> ${this.savingThrow}`);
		}
		if (this.duration) {
			savingThrowDuration.push(`<b>Duration</b> ${this.duration}`);
		}
		return savingThrowDuration.join("; ");
	}
	private toRenderableContentHeighten(content: RenderableContent): void {
		if (this.canHeighten) {
			content.append("");
			const heightenedList = (this.core.heightened ?? []).map(h => `<b>Heightened (${h.bump ? "+" + h.bump : nth(h.level!)})</b> ${h.change}`);
			if (this.core.heightenedAs) {
				content.append(`<b>Heightened</b> As <i>${this.core.heightenedAs}</i>`);
				if (heightenedList.length) {
					content.append(`<blockquote>${heightenedList.join(NEWLINE)}</blockquote>`);
				}
			} else {
				content.append(...heightenedList);
			}
		}
	}
	public toRenderableContent(): RenderableContent {
		const content = new Pf2eRenderableContent(this);

		this.toRenderableContentTitle(content);

		// In case I want to include the spell list description here.
		// this.appendDescriptionTo(content);
		// content.append("");

		const description = [`${this.traits.join(", ")}`];

		description.push(...this.toRenderableContentTraditionsDomainMystery());

		const castTriggerCostRequirements = this.toRenderableContentCastTriggerCostRequirements();
		if (castTriggerCostRequirements.length) {
			description.push(castTriggerCostRequirements);
		}

		const rangeAreaTargets = this.toRenderableContentRangeAreaTargets();
		if (rangeAreaTargets.length) {
			description.push(rangeAreaTargets);
		}

		const savingThrowDuration = this.toRenderableContentSavingThrowDuration();
		if (savingThrowDuration.length) {
			description.push(savingThrowDuration);
		}

		content.append(...description);
		this.appendDetailsTo(content);

		if (this.affliction) {
			content.append("");
			content.append(afflictionToHtml(this.affliction));
		}
		if (this.reaction) {
			content.append("");
			content.append(reactionToHtml(this.reaction));
		}

		this.toRenderableContentHeighten(content);

		if (this.core.creature) {
			content.append(creatureToHtml(this.core.creature));
		}

		const italicMatches = content.findMatches(/<i>(.*?)<\/i>/gi);
		const italicPhrases = italicMatches.map(match => match.slice(3, -4));
		const spellSearches = italicPhrases.map(Spell.find);
		const validSpells = <Spell[]>spellSearches.filter(sp => sp && sp !== this);
		const uniqueSpells = [this, ...validSpells].filter(isUnique);
		const otherSpells = uniqueSpells.slice(1);
		content.addAonLink(...otherSpells.map(spell => spell.toAonLink()));

		return content;
	}
	//#endregion IRenderable

	//#region ISearchable

	public get searchResultCategory(): string {
		const level = this.isCantrip ? `Cantrip` : `Spell ${this.level}`;
		const rarity = this.isNotCommon ? `[${this.rarity}]` : ``;
		return `${level} ${rarity}`;
	}

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			score.append(searchInfo.score(this, this.traits, this.traditions, this.archetypeName));
		}

		const keyTerm = capitalize(searchInfo.keyTerm || "");
		if (findByValue("Class", keyTerm) && !this.traits.includes(keyTerm)) {
			score.fail();
		}
		return score;
	}

	public toSearchResult(): string {
		return this.name.italics();
	}

	//#endregion ISearchable

	//#region static

	public static find(value: UUID): Spell | undefined {
		return findByValue("Spell", value);
	}

	//#endregion
}
