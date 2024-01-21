import { addCommas } from "@rsc-utils/number-utils";
import { RenderableContent, type Renderable } from "@rsc-utils/render-utils";
import { HasScoredSearchables, SearchInfo, SearchScore, type Searchable } from "@rsc-utils/search-utils";
import { StringMatcher } from "@rsc-utils/string-utils";
import type { OrUndefined } from "@rsc-utils/type-utils";
import { UNICODE_ZERO_TO_TEN } from "../sage-common";
import type { IMenuRenderable } from "../sage-lib/discord";
import type { IHasName } from "../sage-pf2e";
import type { Source } from "../sage-pf2e/model/base/Source";

type TRenderableMeta = { hasCompScore:boolean; sources:Source[]; unicodeArray:string[]; unicodeIndex:number; };

type TSearchable = IHasName & Searchable & Renderable;

function scoreToLineItem<T extends TSearchable>(this: SearchResults<T>, meta: TRenderableMeta, score: SearchScore<T>, scoreIndex: number): string {
	const searchable = this.searchables[scoreIndex],
		searchResultCategory = searchable.searchResultCategory,
		category = searchResultCategory ? ` - ${searchResultCategory}` : ``,
		label = `${searchable.toSearchResult()}${category}`,
		emoji = "[spacer]";

	if (meta.hasCompScore) {
		return `${emoji} ${label}`;
	}
	return `${emoji} <b>(${score.totalHits})</b> ${label}`;
}

export class SearchResults<T extends TSearchable = TSearchable> extends HasScoredSearchables<T> implements IMenuRenderable {

	public constructor(public searchInfo: SearchInfo, public objectType?: string) {
		super();
	}

	// #region public properties

	public get term() {
		return this.searchInfo.searchText;
	}

	public get theMatch(): T | null {
		const stringMatcher = StringMatcher.from(this.searchInfo.searchText),
			matches = this.searchables.filter(obj => obj.matches(stringMatcher));
		return matches.length === 1 && matches[0] || null;
	}


	private _sageSearchables: OrUndefined<T>[] | undefined;
	private _actionableSearchables: T[] | undefined;
	private _prepSearchables(): void {
		if (!this._actionableSearchables || !this._sageSearchables) {
			const { sageSearchables, actionableSearchables } = this.prepSearchables();
			this._sageSearchables = sageSearchables;
			this._actionableSearchables = actionableSearchables;
		}
	}
	protected prepSearchables(): { sageSearchables:OrUndefined<T>[], actionableSearchables:T[] } {
		return { sageSearchables:this.searchables, actionableSearchables:[] };
	}

	public get sageSearchables(): OrUndefined<T>[] {
		this._prepSearchables();
		return this._sageSearchables!;
	}

	public get actionableSearchables(): T[] {
		this._prepSearchables();
		return this._actionableSearchables!;
	}
	// #endregion


	// #region utils.DiscordUtils.IMenuRenderable

	public getMenuLength(): number {
		return Math.min(this.count, UNICODE_ZERO_TO_TEN.length);
	}

	public getMenuUnicodeArray(): string[] {
		return UNICODE_ZERO_TO_TEN.slice(0, this.actionableSearchables.length);
	}

	public toMenuRenderableContent(): RenderableContent;
	public toMenuRenderableContent(index: number): RenderableContent;
	public toMenuRenderableContent(index = -1): RenderableContent {
		if (index > -1) {
			return this.actionableSearchables[index].toRenderableContent();
		}

		if (this.theOne) {
			return this.theOne.toRenderableContent();
		}


		const meta: TRenderableMeta = {
			hasCompScore: !!this.scores[0]?.compScore,
			sources: [],
			unicodeArray: this.getMenuUnicodeArray(),
			unicodeIndex: 0
		};

		const content = this.createRenderable();
		if (this.isEmpty) {
			content.append(`Sorry, your search returned no results!`);
		}else {
			content.append(...this.scores.slice(0, this.getMenuLength()).map((score, scoreIndex) => scoreToLineItem.call(this, meta, score, scoreIndex)));
		}
		return content;
	}
	// #endregion

	protected createRenderable(): RenderableContent {
		const isEmpty = this.isEmpty;
		const hasComp = !!this.scores[0]?.compScore;

		const labelPrefix = this.objectType ? `${this.objectType} ` : ``;
		const labelSuffix = this.searchInfo.keyTerm ? ` \\${this.searchInfo.keyTerm}` : ``;
		const label = `${labelPrefix}Search Results for: \`${this.searchInfo.searchText + labelSuffix}\``;

		const title = hasComp || isEmpty ? `<b>${label}</b> not found!` : `<b>${label}</b>`;

		const content = new RenderableContent(title);
		if (!isEmpty) {
			content.append(hasComp ? `<i>Did you mean ...</i>` : `<b>Top Matches</b> (of ${addCommas(this.scores.length)})`);
			content.append(`[spacer] <i><b>(#)</b> represents number of search term hits.</i>`);
		}
		return content;
	}

	// #region Renderable

	public toRenderableContent(): RenderableContent {
		return this.toMenuRenderableContent();
	}

	// #endregion

}
