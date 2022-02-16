import utils, { IRenderable, ISearchable } from "../../sage-utils";
import { UNICODE_ZERO_TO_TEN } from "./consts";
import type HasSource from "../model/base/HasSource";
import type { SourcedCore } from "../model/base/HasSource";
import type Source from "../model/base/Source";
import Pf2tBase from "../model/base/Pf2tBase";

function setTitle(content: utils.RenderUtils.RenderableContent, scores: utils.SearchUtils.SearchScore<any>[], label: string): void {
	if (scores[0].compScore) {
		content.setTitle(`<b>${label}</b> not found!`);
		content.append(`<i>Did you mean ...</i>`);
	} else {
		content.setTitle(`<b>${label}</b>`);
		content.append(`<b>Top Matches</b> (of ${scores.length})`);
	}
	content.append(`[spacer]<i><b>(#)</b> represents number of search term hits.</i>`);
}

export interface IMenuRenderable extends IRenderable {
	getMenuLength(indexes: number[]): number;
	getMenuUnicodeArray(indexes: number[]): string[];
	toMenuRenderableContent(indexes: number[]): utils.RenderUtils.RenderableContent;
}

interface IRenderableSearchable extends ISearchable, IRenderable { }
export default class ScoredMenu<T extends IRenderableSearchable> extends utils.SearchUtils.HasScoredSearchables<T> implements IMenuRenderable {

	public constructor(public label: string) { super(); }

	// #region utils.DiscordUtils.IMenuRenderable

	public getMenuLength(indexes: number[]): number {
		if (indexes.length) {
			return 1;
		}
		return Math.min(this.count, UNICODE_ZERO_TO_TEN.length);
	}
	public getMenuUnicodeArray(indexes: number[]): string[] {
		return UNICODE_ZERO_TO_TEN.slice(0, this.getMenuLength(indexes));
	}
	public toMenuRenderableContent(indexes: number[]): utils.RenderUtils.RenderableContent {
		if (this.theOne) {
			return this.theOne.toRenderableContent();
		}

		if (indexes.length > 0) {
			return this.searchables[indexes[0]].toRenderableContent();
		}

		const content = new utils.RenderUtils.RenderableContent();
		const unicodeArray = this.getMenuUnicodeArray(indexes);
		const hasCompScore = !!this.scores[0].compScore;

		setTitle(content, this.scores, this.label);

		let unicodeIndex = 0;
		let hasPf2tResult = false;
		const sources = <Source[]>[];
		this.scores.slice(0, this.getMenuLength(indexes)).forEach(score => {
			if (score.searchable instanceof Pf2tBase) {
				hasPf2tResult = true;
			}
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
			if (hasCompScore) {
				content.append(`${unicodeArray[unicodeIndex++] || ""} ${label} `);
			} else {
				content.append(`${unicodeArray[unicodeIndex++] || ""} <b>(${score.totalHits})</b> ${label}`);
			}
		});
		if (hasPf2tResult) {
			content.append(`<i>${utils.NumberUtils.toSuperscript(0)}Content from <https://character.pf2.tools></i>`);
		}
		sources.forEach((source, index) => content.append(`<i>${utils.NumberUtils.toSuperscript(index + 1)}${source.name}</i>`));
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
