import { nth } from "../../sage-utils/NumberUtils";
import type { RenderableContent } from "../../sage-utils/RenderUtils";
import type { SearchInfo, SearchScore } from "../../sage-utils/SearchUtils";
import { NEWLINE } from "../common";
import { Pf2eRenderableContent } from "../Pf2eRenderableContent";
import type { SourcedCore } from "./base/HasSource";
import { HasSource } from "./base/HasSource";
import type { TSpellHeighten } from "./Spell";

export interface RitualCore extends SourcedCore<"Ritual"> {
	level: number;
	cast: string;
	cost: string;
	secondaryCasters: string;
	primaryCheck: string;
	secondaryChecks: string;
	area: string;
	range: string;
	targets: string;
	duration: string;
	heightened?: TSpellHeighten[];
	heightenedAs?: string[];
}

export class Ritual extends HasSource<RitualCore> {
	public constructor(core: RitualCore) {
		super(core);
		this.canHeighten = !!core.heightenedAs || (core.heightened?.length ?? 0) > 0;
	}

	public get level(): number { return this.core.level || 0; }
	public get cast(): string { return this.core.cast || ""; }
	public get cost(): string { return this.core.cost || ""; }
	public get secondaryCasters(): string { return this.core.secondaryCasters || ""; }
	public get primaryCheck(): string { return this.core.primaryCheck || ""; }
	public get secondaryChecks(): string { return this.core.secondaryChecks || ""; }
	public get area(): string { return this.core.area || ""; }
	public get range(): string { return this.core.range || ""; }
	public get targets(): string { return this.core.targets || ""; }
	public get duration(): string { return this.core.duration || ""; }

	public canHeighten: boolean;

	//#region IRenderable
	private toCastCostSecondaries(): string {
		const castCostSecondaries: string[] = [];
		if (this.cast) {
			castCostSecondaries.push(`<b>Cast</b> ${this.cast}`);
		}
		if (this.cost) {
			castCostSecondaries.push(`<b>Cost</b> ${this.cost}`);
		}
		if (this.secondaryCasters) {
			castCostSecondaries.push(`<b>Secondary Casters</b> ${this.secondaryCasters}`);
		}
		return castCostSecondaries.join("; ");
	}
	private toChecks(): string {
		const checks: string[] = [];
		if (this.primaryCheck) {
			checks.push(`<b>Primary Check</b> ${this.primaryCheck}`);
		}
		if (this.secondaryChecks) {
			checks.push(`<b>Secondary Checks</b> ${this.secondaryChecks}`);
		}
		return checks.join("; ");
	}
	private toRangeAreaTargets(): string {
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
	public toRenderableContent(): RenderableContent {
		const content = new Pf2eRenderableContent(this);

		const title = `<b>${this.name}</b> - Ritual ${this.level}`;
		content.setTitle(title);

		const description = [`${this.traits.join(", ")}`];

		const castCostSecondaries = this.toCastCostSecondaries();
		if (castCostSecondaries.length) {
			description.push(castCostSecondaries);
		}

		const checks = this.toChecks();
		if (checks.length) {
			description.push(checks);
		}

		const rangeAreaTargets = this.toRangeAreaTargets();
		if (rangeAreaTargets.length) {
			description.push(rangeAreaTargets);
		}

		if (this.duration) {
			description.push(`<b>Duration</b> ${this.duration}`);
		}

		content.append(...description);
		this.appendDescriptionTo(content);
		this.appendDetailsTo(content);

		if (this.canHeighten) {
			content.append("");
			const heightenedList = (this.core.heightened || []).map(h => `<b>Heightened (${h.bump ? "+" + h.bump : nth(h.level!)})</b> ${h.change}`);
			if (this.core.heightenedAs) {
				content.append(`<b>Heightened</b> As <i>${this.core.heightenedAs}</i>`);
				if (heightenedList.length) {
					content.append(`<blockquote>${heightenedList.join(NEWLINE)}</blockquote>`);
				}
			} else {
				content.append(...heightenedList);
			}
		}

		/*
		// let spellsOrRituals: (Ritual|Spell)[] = [this];
		// spellsOrRituals.push(...content.findMatches(/<i>(.*?)<\/i>/gi).map(spellName =>
		// 	Repository.findByValue<Spell>("Spell", spellName.slice(3, -4))
		// 	?? Repository.findByValue<Ritual>("Ritual", spellName.slice(3, -4))
		// 	).filter(sp => sp && sp !== this));
		// content.addAonLink(...spellsOrRituals.filter(utils.ArrayUtils.Filters.unique).slice(1).map(spell => spell.toAonLink()));
		*/

		return content;
	}
	//#endregion IRenderable

	//#region ISearchable

	public get searchResultCategory(): string {
		const level = `Ritual ${this.level}`;
		const rarity = this.isNotCommon ? `[${this.rarity}]` : ``;
		return `${level} ${rarity}`;
	}

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			score.append(searchInfo.score(this, this.cast, this.cost, this.secondaryCasters, this.primaryCheck, this.secondaryChecks, this.area, this.range, this.targets, this.duration));
		}
		return score;
	}

	public toSearchResult(): string {
		return this.name.italics();
	}

	//#endregion ISearchable

}
