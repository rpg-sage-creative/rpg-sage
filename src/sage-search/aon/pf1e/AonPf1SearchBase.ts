import type { TResultsLink } from "..";
import { HasCore, IHasNameCore } from "../../../sage-utils/ClassUtils";
import { IRenderable, RenderableContent } from "../../../sage-utils/RenderUtils";
import type { ISearchable, SearchInfo, SearchScore } from "../../../sage-utils/SearchUtils";
import { StringMatcher } from "../../../sage-utils/StringUtils";
import { createSearchResultUrl } from "./helpers";

/**
 * temp solution for pf1 search results using the existing search output mechanism
 * ultimately this should house the results and not the categories ... but i wanna just get *A* solution first
 */
export class AonPf1SearchBase
	extends
		HasCore<TResultsLink, string>
	implements
		IHasNameCore,
		IRenderable,
		ISearchable {

	// #region IHasName

	private _nameMatcher?: StringMatcher;
	private get nameMatcher(): StringMatcher {
		return this._nameMatcher ?? (this._nameMatcher = StringMatcher.from(this.name));
	}

	public get name(): string { return this.core.label; }
	// public get nameClean(): string { return this.nameMatcher.clean; }
	// public get nameLower(): string { return this.nameMatcher.lower; }

	public matches(other: StringMatcher): boolean {
		return this.nameMatcher.matches(other);
	}

	// #endregion IHasName

	//#region ISearchable

	public get searchResultCategory(): string { return this.core.cat; }

	public search(searchInfo: SearchInfo): SearchScore<this> {
		return searchInfo.score(this, this.name);
	}

	public searchRecursive(searchInfo: SearchInfo): SearchScore<this>[] {
		return [this.search(searchInfo)];
	}

	public toSearchResult(): string {
		const category = this.searchResultCategory.replace("Magic Items - Wondrous Items", "Wondrous Items");
		const url = createSearchResultUrl(this.core);
		return `[aon] ${this.name} - ${category} <a href="${url}">(link)</a>`;
	}

	//#endregion

	// #region IRenderable

	public toRenderableContent(): RenderableContent {
		const renderable = new RenderableContent(this.name);
		renderable.setTitle(`<b>${this.name}</b> (${this.core.cat})`);
		renderable.append(`<a href="${this.core.url}">${this.core.label}</a>`);
		return renderable;
	}

	// #endregion IRenderable

}