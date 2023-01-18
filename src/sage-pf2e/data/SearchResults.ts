import { GameType } from "../../sage-dice";
import type { IMenuRenderable } from "../../sage-lib/discord";
import utils, { OrUndefined } from "../../sage-utils";
import type { SearchScore } from "../../sage-utils/utils/SearchUtils";
import AonBase from "../model/base/AonBase";
import type Base from "../model/base/Base";
import type HasSource from "../model/base/HasSource";
import type Source from "../model/base/Source";
import { UNICODE_ZERO_TO_TEN } from "./consts";
import { findByAonBase } from "./Repository";

type TScore = SearchScore<AonBase>;

function createLabel(searchInfo: utils.SearchUtils.SearchInfo, objectType?: string): string {
	if (searchInfo.gameType !== GameType.PF2e) {
		return `Cannot Search: ${GameType[searchInfo.gameType]} `;
	}
	const prefix = objectType ? `${objectType} ` : ``;
	const suffix = searchInfo.keyTerm ? ` \\${searchInfo.keyTerm}` : ``;
	return `${prefix}Search Results for: \`${searchInfo.searchText + suffix}\``;
}

function createRenderable(searchResults: SearchResults): utils.RenderUtils.RenderableContent {
	const isEmpty = searchResults.isEmpty;
	const hasComp = !!searchResults.scores[0]?.compScore;
	const label = createLabel(searchResults.searchInfo, searchResults.objectType);
	const title = hasComp || isEmpty ? `<b>${label}</b> not found!` : `<b>${label}</b>`;
	const content = new utils.RenderUtils.RenderableContent(searchResults.searchInfo.gameType !== GameType.PF2e ? label : title);
	if (!isEmpty) {
		content.append(hasComp ? `<i>Did you mean ...</i>` : `<b>Top Matches</b> (of ${searchResults.scores.length})`);
		content.append(`[spacer] <i><b>(#)</b> represents number of search term hits.</i>`);
	}
	return content;
}

function createClickableSearchLink(searchResults: SearchResults, label: string): string {
	const query = searchResults.searchInfo.searchText.replace(/\s+/g, "+") ?? "";
	let url = "";
	switch (searchResults.searchInfo.gameType) {
		case GameType.SF1e:
			url = `https://www.aonsrd.com/Search.aspx?Query=${query}`;
			break;
		case GameType.PF1e:
			url = `https://www.aonprd.com/Search.aspx?Query=${query}`;
			break;
		case GameType.PF2e:
			url = `https://2e.aonprd.com/Search.aspx?query=${query}`;
			break;
		default:
			return "<i>Unable to Search for this Game System</i>";
	}
	return `<a href="${url}">${label}</a>`;
}

type TRenderableMeta = { hasCompScore:boolean; sources:Source[]; unicodeArray:string[]; unicodeIndex:number; };

function toSourceSuper(this: TRenderableMeta, source: Source): string {
	if (source && !source.isCore) {
		if (!this.sources.includes(source)) {
			this.sources.push(source);
		}
		return utils.NumberUtils.toSuperscript(this.sources.indexOf(source) + 1);
	}
	return "";
}

function isActionable(sage?: Base): sage is Base {
	return sage?.hasDescription === true || sage?.hasDetails === true;
}

function scoreToLineItem(this: SearchResults, meta: TRenderableMeta, score: TScore, scoreIndex: number): string {
	const aonSearchable = this.searchables[scoreIndex],
		sageSearchable = this.sageSearchables[scoreIndex],
		searchable = sageSearchable ?? aonSearchable,
		sourceSuper = toSourceSuper.call(meta, (searchable as HasSource).source),
		searchResultCategory = searchable.searchResultCategory,
		category = searchResultCategory ? ` - ${searchResultCategory}` : ``,
		label = `${searchable.toSearchResult()}${sourceSuper}${category}`,
		aonLink = aonSearchable.toAonLink(true),
		emoji = isActionable(sageSearchable) ? meta.unicodeArray[meta.unicodeIndex++] ?? "[aon]" : "[aon]";

	if (meta.hasCompScore) {
		return `${emoji} ${label} ${aonLink}`;
	}
	return `${emoji} <b>(${score.totalHits})</b> ${label} ${aonLink}`;
}

function sourceToFootnote(source: Source, sourceIndex: number): string {
	return `<i>${utils.NumberUtils.toSuperscript(sourceIndex + 1)}${source.name}</i>`;
}

export default class SearchResults extends utils.SearchUtils.HasScoredSearchables<AonBase> implements IMenuRenderable {

	public constructor(public searchInfo: utils.SearchUtils.SearchInfo, public objectType?: string) {
		super();
	}

	// #region public properties

	public get term() {
		return this.searchInfo.searchText;
	}

	public get theMatch() {
		const stringMatcher = utils.StringUtils.StringMatcher.from(this.searchInfo.searchText),
			matches = this.searchables.filter(obj => obj.matches(stringMatcher));
		return matches.length === 1 && matches[0] || null;
	}

	// #endregion

	private _sageSearchables: OrUndefined<Base>[] | undefined;
	private _actionableSearchables: Base[] | undefined;
	private prepSearchables(): void {
		const menuLength = this.getMenuLength();
		this._sageSearchables = [];
		this._actionableSearchables = [];
		this.searchables.forEach((searchable, index) => {
			const aon = searchable instanceof AonBase ? searchable : undefined;
			const sage = aon ? findByAonBase(aon) : undefined;
			this._sageSearchables?.push(sage);
			if (isActionable(sage) && index < menuLength) {
				this._actionableSearchables?.push(sage);
			}
		});
	}
	public get sageSearchables(): OrUndefined<Base>[] {
		if (!this._sageSearchables) {
			this.prepSearchables();
		}
		return this._sageSearchables!;
	}
	public get actionableSearchables(): Base[] {
		if (!this._actionableSearchables) {
			this.prepSearchables();
		}
		return this._actionableSearchables!;
	}

	// #region utils.DiscordUtils.IMenuRenderable

	public getMenuLength(): number {
		return Math.min(this.count, UNICODE_ZERO_TO_TEN.length);
	}

	public getMenuUnicodeArray(): string[] {
		return UNICODE_ZERO_TO_TEN.slice(0, this.actionableSearchables.length);
	}

	public toMenuRenderableContent(): utils.RenderUtils.RenderableContent;
	public toMenuRenderableContent(index: number): utils.RenderUtils.RenderableContent;
	public toMenuRenderableContent(index = -1): utils.RenderUtils.RenderableContent {
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

		const content = createRenderable(this);
		if (this.isEmpty) {
			content.append(createClickableSearchLink(this, `Search Archives of Nethys Directly`));
		}else {
			content.append(...this.scores.slice(0, this.getMenuLength()).map((score, scoreIndex) => scoreToLineItem.call(this, meta, score, scoreIndex)));
			content.append(...meta.sources.map(sourceToFootnote));
			content.append(createClickableSearchLink(this, `View Results on Archives of Nethys`));
		}
		return content;
	}

	// #endregion

	// #region utils.RenderUtils.IRenderable

	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		return this.toMenuRenderableContent();
	}

	// #endregion
}
