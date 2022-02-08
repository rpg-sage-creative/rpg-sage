import utils, { IRenderable, ISearchable } from "../../../sage-utils";
import { DiscordMaxValues, UNICODE_ZERO_TO_TEN } from "../../discord";
import type { IMenuRenderable } from "../../discord/types";
import type { HasSource, SourcedCore, Source } from "../../../sage-pf2e";

interface IRenderableSearchable extends ISearchable, IRenderable { }
export default class ScoredMenu<T extends IRenderableSearchable> extends utils.SearchUtils.HasScoredSearchables<T> implements IMenuRenderable {

	public constructor(public label: string) { super(); }

	// #region utils.DiscordUtils.IMenuRenderable

	public getMenuLength(indexes: number[]): number {
		if (indexes.length) {
			return 1;
		}
		const minReactionCount = Math.min(DiscordMaxValues.message.reactionCount, UNICODE_ZERO_TO_TEN.length);
		return Math.min(this.count, minReactionCount);
	}
	public getMenuUnicodeArray(indexes: number[]): string[] {
		return UNICODE_ZERO_TO_TEN.slice(0, this.getMenuLength(indexes));
	}
	public toMenuRenderableContent(indexes: number[]): utils.RenderUtils.RenderableContent {
		if (this.theOne) {
			return this.theOne.toRenderableContent();
		}
		let content = new utils.RenderUtils.RenderableContent();
		if (indexes.length === 0) {
			const unicodeArray = this.getMenuUnicodeArray(indexes),
				usingComparison = this.scores[0].compScore;
			let unicodeIndex = 0;
			if (usingComparison) {
				content.setTitle(`<b>${this.label}</b> not found!`);
				content.append(`<i>Did you mean ...</i>`);
			} else {
				content.setTitle(`<b>${this.label}</b>`);
				content.append(`<b>Top Matches</b> (of ${this.scores.length})`);
			}
			content.append(`[spacer]<i><b>(#)</b> represents number of search term hits.</i>`);
			const sources = <Source[]>[];
			this.scores.slice(0, this.getMenuLength(indexes)).forEach(score => {
				const source = (<HasSource<SourcedCore>><unknown>score.searchable).source;
				let sourceSuper = ``;
				if (source && !source.isCore) {
					if (!sources.includes(source)) {
						sources.push(source);
					}
					sourceSuper = utils.NumberUtils.toSuperscript(sources.indexOf(source) + 1);
				}

				const category = score.searchable.searchResultCategory,
					label = category ? `${score.searchable.toSearchResult()}${sourceSuper} - ${category}` : `${score.searchable.toSearchResult()}${sourceSuper}`;
				if (usingComparison) {
					content.append(`${unicodeArray[unicodeIndex++] || ""} ${label} `);
				} else {
					content.append(`${unicodeArray[unicodeIndex++] || ""} <b>(${score.totalHits})</b> ${label}`);
				}
			});
			sources.forEach((source, index) => content.append(`<i>${utils.NumberUtils.toSuperscript(index + 1)}${source.name}</i>`));
		} else {
			content = this.searchables[indexes[0]].toRenderableContent();
		}
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
