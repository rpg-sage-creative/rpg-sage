import { HasCore, RenderableContent, StringMatcher, type Renderable, type SearchInfo, type SearchScore, type Searchable } from "@rsc-utils/core-utils";
import type { IHasName } from "../../../sage-pf2e/index.js";
import { createAon1eSearchResultUrl } from "./createAon1eSearchResultUrl.js";
import type { Aon1eGameSystemCode, Aon1eSearchResultsLink } from "./types.js";

/**
 * temp solution for 1e search results using the existing search output mechanism
 * ultimately this should house the results and not the categories ... but i wanna just get *A* solution first
 */
export class Aon1eSearchBase
	extends
		HasCore<Aon1eSearchResultsLink, string>
	implements
		IHasName,
		Renderable,
		Searchable {

	public constructor(public gameSystem: Aon1eGameSystemCode, core: Aon1eSearchResultsLink) {
		super(core);
	}

	// #region IHasName

	private _nameMatcher?: StringMatcher;
	private get nameMatcher(): StringMatcher {
		return this._nameMatcher ?? (this._nameMatcher = StringMatcher.from(this.name));
	}

	public get name(): string { return this.core.label; }
	public get nameClean(): string { return this.nameMatcher.matchValue; }
	public get nameLower(): string { return this.nameMatcher.lower; }

	public matches(other: StringMatcher): boolean {
		return this.nameMatcher.matches(other);
	}

	// #endregion IHasName

	//#region Searchable

	public get searchResultCategory(): string { return this.core.cat; }

	public search(searchInfo: SearchInfo): SearchScore<this> {
		return searchInfo.score(this, this.name);
	}

	public searchRecursive(searchInfo: SearchInfo): SearchScore<this>[] {
		return [this.search(searchInfo)];
	}

	public toSearchResult(): string {
		const category = this.searchResultCategory.replace("Magic Items - Wondrous Items", "Wondrous Items"); // PF1e
		// const category = this.searchResultCategory; // SF1e
		const url = createAon1eSearchResultUrl(this.gameSystem, this.core);
		return `[aon] ${this.name} - ${category} <a href="${url}">(link)</a>`;
	}

	//#endregion

	// #region Renderable

	public toRenderableContent(): RenderableContent {
		const renderable = new RenderableContent(this.name);
		renderable.setTitle(`<b>${this.name}</b> (${this.core.cat})`);
		renderable.append(`<a href="${this.core.url}">${this.core.label}</a>`);
		return renderable;
	}

	// #endregion Renderable

}