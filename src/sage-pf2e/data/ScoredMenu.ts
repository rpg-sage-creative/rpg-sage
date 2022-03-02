import utils, { IRenderable, ISearchable } from "../../sage-utils";
import { UNICODE_ZERO_TO_TEN } from "./consts";
import type HasSource from "../model/base/HasSource";
import type Source from "../model/base/Source";
import AonBase from "../model/base/AonBase";
import { findByAonBase } from "./Repository";
import type { IMenuRenderable } from "../../sage-lib/discord";

function setTitle(content: utils.RenderUtils.RenderableContent, scores: utils.SearchUtils.SearchScore<any>[], label: string): void {
	if (scores[0].compScore) {
		content.setTitle(`<b>${label}</b> not found!`);
		content.append(`<i>Did you mean ...</i>`);
	} else {
		content.setTitle(`<b>${label}</b>`);
		content.append(`<b>Top Matches</b> (of ${scores.length})`);
	}
	content.append(`[spacer] <i><b>(#)</b> represents number of search term hits.</i>`);
}

function toAonLink(searchable: any): string {
	return searchable instanceof AonBase ? searchable.toAonLink(true) : "";
}

function lookupSearchable<T extends ISearchable>(searchable: T): [HasSource, AonBase | null] {
	const aonBase = searchable instanceof AonBase ? searchable : null;
	if (aonBase) {
		const found = findByAonBase(aonBase as AonBase);
		if (found) {
			return [found as HasSource, aonBase];
		}
	}
	return [searchable as unknown as HasSource, aonBase];
}

interface IRenderableSearchable extends ISearchable, IRenderable { }
export default class ScoredMenu<T extends IRenderableSearchable> extends utils.SearchUtils.HasScoredSearchables<T> implements IMenuRenderable {

	public constructor(public label: string) { super(); }

	// #region utils.DiscordUtils.IMenuRenderable

	public getMenuLength(): number {
		return Math.min(this.count, UNICODE_ZERO_TO_TEN.length);
	}
	public getMenuUnicodeArray(): string[] {
		const actionable = this.searchables.filter(s => !(s instanceof AonBase)).length;
		return UNICODE_ZERO_TO_TEN.slice(0, actionable);
	}
	public toMenuRenderableContent(): utils.RenderUtils.RenderableContent;
	public toMenuRenderableContent(index: number): utils.RenderUtils.RenderableContent;
	public toMenuRenderableContent(index = -1): utils.RenderUtils.RenderableContent {
		if (index > 0) {
			return this.searchables[index].toRenderableContent();
		}

		if (this.theOne) {
			return this.theOne.toRenderableContent();
		}

		const content = new utils.RenderUtils.RenderableContent();
		const unicodeArray = this.getMenuUnicodeArray();
		const hasCompScore = !!this.scores[0].compScore;

		setTitle(content, this.scores, this.label);

		let unicodeIndex = 0;
		const sources = <Source[]>[];
		this.scores.slice(0, this.getMenuLength()).forEach(score => {
			const [searchable, aonBase] = lookupSearchable(score.searchable);
			const source = searchable.source;
			let sourceSuper = ``;
			if (source && !source.isCore) {
				if (!sources.includes(source)) {
					sources.push(source);
				}
				sourceSuper = utils.NumberUtils.toSuperscript(sources.indexOf(source) + 1);
			// }else if (!source) {
				// console.log((score.searchable as any).source ?? (score.searchable as any).core.source);
			}

			const searchResultCategory = score.searchable.searchResultCategory,
				category = searchResultCategory ? ` - ${searchResultCategory}` : ``,
				label = `${score.searchable.toSearchResult()}${sourceSuper}${category}`,
				aonLink = toAonLink(aonBase ?? searchable),
				emoji = aonBase === searchable ? "<:AoN:948328874712920095>" : unicodeArray[unicodeIndex++];
			if (hasCompScore) {
				content.append(`${emoji} ${label} ${aonLink}`);
			} else {
				content.append(`${emoji} <b>(${score.totalHits})</b> ${label} ${aonLink}`);
			}
		});
		sources.forEach((source, sourceIndex) => content.append(`<i>${utils.NumberUtils.toSuperscript(sourceIndex + 1)}${source.name}</i>`));
		return content;
	}
	// #endregion

	// #region utils.RenderUtils.IRenderable
	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		const content = new utils.RenderUtils.RenderableContent();
		content.setTitle(`<b>${this.label}</b>`);
		if (this.isEmpty) {
			content.append(`<blockquote><i>No Results Found.</i></blockquote>`);
		} else {
			content.append(`<b>Top Hits</b> (of ${this.scores.length})`);
			this.scores.forEach(score => {
				content.append(`${score.searchable.toSearchResult()}: (${score.totalHits}) `);
			});
		}
		return content;
	}
	// #endregion
}
