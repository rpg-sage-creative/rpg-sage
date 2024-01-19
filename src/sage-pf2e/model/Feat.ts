import type { SortResult } from "@rsc-utils/array-utils";
import type { RenderableContent as UtilsRenderableContent } from "../../sage-utils/utils/RenderUtils";
import type { SearchInfo, SearchScore } from "../../sage-utils/utils/SearchUtils";
import type { TAction } from "../common";
import { RenderableContent } from "../data/RenderableContent";
import { HasSource, SourcedCore } from "../model/base/HasSource";
import type { Metadata } from "./Metadata";
import type { IHasMetadata, IMetadata } from "./Metadata";

/**************************************************************************************************************************/
// Interface and Class

export interface FeatCore<T extends string = "Feat"> extends SourcedCore<T> {
	access: string | string[];
	actionType?: TAction;
	cost: string | string[];
	frequency: string | string[];
	level: number;
	metadata: IMetadata;
	prerequisites: string | string[];
	special: string | string[];
	trigger: string | string[];
}

function ensureArray(input: string | string[]): string[] {
	if (Array.isArray(input)) {
		return input;
	}
	return typeof (input) === "string" ? [input] : [];
}

export class Feat<T extends string = "Feat", U extends FeatCore<T> = FeatCore<T>> extends HasSource<U, T> implements IHasMetadata {
	/**************************************************************************************************************************/
	// Constructor

	public constructor(core: U) {
		super(core);
		/*
		// this.hasMetadata = Object.keys(core.metadata || {}).length > 0;
		// this.metadata = new Metadata(core.metadata);
		*/
	}

	/**************************************************************************************************************************/
	// Properties

	public hasMetadata!: boolean;
	public metadata!: Metadata;

	public get access(): string[] { return ensureArray(this.core.access); }
	public get actionType(): TAction { return this.core.actionType || <TAction>""; }
	public get cost(): string[] { return ensureArray(this.core.cost); }
	public get frequency(): string[] { return ensureArray(this.core.frequency); }
	public isDedication = false;
	public isMulticlass = false;
	public get level(): number { return this.core.level || 0; }
	public get prerequisites(): string[] { return ensureArray(this.core.prerequisites); }
	public get special(): string[] { return ensureArray(this.core.special); }
	// public get traits(): string[] { return this._traits || (this._traits = (this.core.traits || []).filter(trait => trait !== this.archetypeName && trait !== "ClassPath")); }
	public get trigger(): string[] { return ensureArray(this.core.trigger); }

	public isGeneral = this.traits.includes("General");
	public isSkill = this.traits.includes("Skill");

	// #region Comparable<T>
	public compareTo(other: Feat<T, U>): SortResult {
		if (this.core.objectType !== other.objectType) {
			return this.core.objectType < other.core.objectType ? -1 : 1;
		}
		if (this.level !== other.level) {
			return this.level < other.level ? -1 : 1;
		}
		if (this.nameLower === other.nameLower) {
			return this.name < other.name ? 1 : -1;
		}
		return this.nameLower < other.nameLower ? -1 : 1;
	}
	// #endregion Comparable<T>

	// #region utils.RenderUtils.IRenderable
	public toRenderableContent(): UtilsRenderableContent {
		const content = new RenderableContent(this);

		const title = `<b>${this.name}</b> - Feat ${this.level}`;
		content.setTitle(title);

		content.append(this.traits.join(", "));

		content.append(`<b>Prerequisites</b> ${this.prerequisites.join(this.prerequisites.find(s => s.includes(",")) ? "; " : ", ")}`);
		content.appendParagraphs(this.frequency, "Frequency");
		content.appendParagraphs(this.access, "Access");
		/*// content.append(...this.requirements.map((d, i) => (i ? TAB : "<b>Requirements</b> ") + d));*/
		content.appendParagraphs(this.trigger, "Trigger");
		content.appendParagraphs(this.cost, "Cost");
		this.appendDetailsTo(content);
		content.appendParagraphs(this.special, "Special");

		/*
		// let spells: Spell[] = [this];
		// spells.push(...content.findMatches(/<i>(.*?)<\/i>/gi).map(spellName => Repository.findByValue<Spell>("Spell", spellName.slice(3, -4))).filter(sp => sp && sp !== this));
		// content.addAonLink(...toUnique(spells).slice(1).map(spell => spell.toAonLink()));
		*/

		return content;
	}
	// #endregion utils.RenderUtils.IRenderable

	// #region utils.SearchUtils.ISearchable

	public get searchResultCategory(): string {
		const types: string[] = [];
		if (this.isGeneral) {
			types.push("General");
		}
		if (this.isSkill) {
			types.push("Skill");
		}
		const rarity = this.isNotCommon ? `[${this.rarity}]` : ``;
		return `${types.join(" ")} Feat ${this.level} ${rarity}`;
	}

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			score.append(searchInfo.score(this, this.access, this.cost, this.frequency, this.prerequisites, this.special, this.traits, this.trigger));
		}
		return score;
	}

	// #endregion utils.SearchUtils.ISearchable

}
