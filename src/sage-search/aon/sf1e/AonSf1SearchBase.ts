import { HasCore, RenderableContent, type Renderable } from "@rsc-utils/core-utils";
import type { SearchInfo, SearchScore, Searchable } from "@rsc-utils/search-utils";
import { StringMatcher } from "@rsc-utils/string-utils";
import type { IHasName } from "../../../sage-pf2e/index.js";
import type { TResultsLink } from "../index.js";
import { createSearchResultUrl } from "./index.js";

/**
 * temp solution for Sf1 search results using the existing search output mechanism
 * ultimately this should house the results and not the categories ... but i wanna just get *A* solution first
 */
export class AonSf1SearchBase
	extends
		HasCore<TResultsLink, string>
	implements
		IHasName,
		Renderable,
		Searchable {

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
		const category = this.searchResultCategory;
		const url = createSearchResultUrl(this.core);
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