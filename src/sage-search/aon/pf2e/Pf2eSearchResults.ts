import { createSearchUrl } from ".";
import { findByAonBase } from "../../../sage-pf2e/data/Repository";
import AonBase from "../../../sage-pf2e/model/base/AonBase";
import type Base from "../../../sage-pf2e/model/base/Base";
import type HasSource from "../../../sage-pf2e/model/base/HasSource";
import type Source from "../../../sage-pf2e/model/base/Source";
import type { OrUndefined } from "../../../sage-utils";
import { toSuperscript } from "../../../sage-utils/utils/NumberUtils";
import { RenderableContent } from "../../../sage-utils/utils/RenderUtils";
import type { SearchScore } from "../../../sage-utils/utils/SearchUtils";
import SearchResults from "../../SearchResults";

type TScore = SearchScore<Base>;

function createClickableSearchLink(searchResults: Pf2eSearchResults, label: string): string {
	const url = createSearchUrl(searchResults.searchInfo.searchText);
	return `<a href="${url}">${label}</a>`;
}

type TRenderableMeta = { hasCompScore:boolean; sources:Source[]; unicodeArray:string[]; unicodeIndex:number; };

function toSourceSuper(this: TRenderableMeta, source: Source): string {
	if (source && !source.isCore) {
		if (!this.sources.includes(source)) {
			this.sources.push(source);
		}
		return toSuperscript(this.sources.indexOf(source) + 1);
	}
	return "";
}

function isActionable(sage?: Base): sage is Base {
	return sage?.hasDescription === true || sage?.hasDetails === true;
}

function scoreToLineItem(this: Pf2eSearchResults, meta: TRenderableMeta, score: TScore, scoreIndex: number): string {
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
	return `<i>${toSuperscript(sourceIndex + 1)}${source.name}</i>`;
}

export default class Pf2eSearchResults extends SearchResults<AonBase> {

	protected prepSearchables(): { sageSearchables:OrUndefined<AonBase>[], actionableSearchables:AonBase[] } {
		const menuLength = this.getMenuLength();
		const sageSearchables: OrUndefined<AonBase>[] = [];
		const actionableSearchables: AonBase[] = [];
		this.searchables.forEach((searchable, index) => {
			const aon = searchable instanceof AonBase ? searchable : undefined;
			const sage = aon ? findByAonBase(aon) as AonBase: undefined;
			sageSearchables.push(sage);
			if (isActionable(sage) && index < menuLength) {
				actionableSearchables.push(sage);
			}
		});
		return { sageSearchables, actionableSearchables };
	}

	protected createRenderable(): RenderableContent {
		const isEmpty = this.isEmpty;
		const hasComp = !!this.scores[0]?.compScore;

		const labelPrefix = this.objectType ? `${this.objectType} ` : ``;
		const labelSuffix = this.searchInfo.keyTerm ? ` \\${this.searchInfo.keyTerm}` : ``;
		const label = `Pathfinder 2e ${labelPrefix}Search Results for: \`${this.searchInfo.searchText + labelSuffix}\``;

		const title = hasComp || isEmpty ? `<b>${label}</b> not found!` : `<b>${label}</b>`;

		const content = new RenderableContent(title);
		if (!isEmpty) {
			content.append(hasComp ? `<i>Did you mean ...</i>` : `<b>Top Matches</b> (of ${this.scores.length})`);
			content.append(`[spacer] <i><b>(#)</b> represents number of search term hits.</i>`);
		}
		return content;
	}

	// #region utils.DiscordUtils.IMenuRenderable

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
			content.append(createClickableSearchLink(this, `Search Archives of Nethys Directly`));
		}else {
			content.append(...this.scores.slice(0, this.getMenuLength()).map((score, scoreIndex) => scoreToLineItem.call(this, meta, score, scoreIndex)));
			content.append(...meta.sources.map(sourceToFootnote));
			content.append(createClickableSearchLink(this, `View Results on Archives of Nethys`));
		}
		return content;
	}

	// #endregion

}
