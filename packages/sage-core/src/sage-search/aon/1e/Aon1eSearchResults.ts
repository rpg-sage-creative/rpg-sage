import { addCommas, RenderableContent } from "@rsc-utils/core-utils";
import { SearchResults } from "../../SearchResults.js";
import type { Aon1eSearchBase } from "./Aon1eSearchBase.js";
import { createAon1eSearchUrl } from "./createAon1eSearchUrl.js";
import type { GameSearchInfo } from "../../GameSearchInfo.js";
import type { Aon1eGameSystemCode } from "./types.js";

function createClickableSearchLink(searchResults: Aon1eSearchResults, label: string): string {
	const url = createAon1eSearchUrl(searchResults.searchInfo.gameSystem, searchResults.searchInfo.searchText);
	return `<a href="${url}">${label}</a>`;
}

export class Aon1eSearchResults extends SearchResults<Aon1eSearchBase> {
	declare public searchInfo: GameSearchInfo<Aon1eGameSystemCode>;
	public constructor(searchInfo: GameSearchInfo<Aon1eGameSystemCode>) {
		super(searchInfo);
	}

	protected createRenderable(): RenderableContent {
		// const labelPrefix = this.objectType ? `${this.objectType} ` : ``;
		// const labelSuffix = this.searchInfo.keyTerm ? ` \\${this.searchInfo.keyTerm}` : ``;
		// const label = `${labelPrefix}Search Results for: \`${this.searchInfo.searchText + labelSuffix}\``;
		const gameName = this.searchInfo.gameSystem === "SF1e" ? "Starfinder" : "Pathfinder";
		const label = `${gameName} 1e Search Results for: \`${this.searchInfo.searchText}\``;

		const title = this.isEmpty ? `<b>${label}</b> not found!` : `<b>${label}</b>`;

		const content = new RenderableContent(title);
		if (!this.isEmpty) {
			content.append(`<b>First ${this.getMenuLength()} Matches</b> (of ${addCommas(this.scores.length)})`);
		}
		return content;
	}

	public get theOne(): Aon1eSearchBase | undefined { return undefined; }
	public get theMatch(): Aon1eSearchBase | undefined { return undefined; }


	// #region IMenuRenderable

	public getMenuLength(): number {
		return Math.min(this.count, 10);
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

		const content = this.createRenderable();
		if (this.isEmpty) {
			if (this.searchInfo.gameSystem === "PF1e") {
				content.append(`> NOTE: AoN Searches for Pathfinder 1e have been too slow recently, causing timeouts. Until this can be resolved, please simply click the link below.`);
			}
			content.append(createClickableSearchLink(this, `Search Archives of Nethys Directly`));
		}else {
			content.append(...this.scores.slice(0, this.getMenuLength()).map(score => score.searchable.toSearchResult()));
			content.append(createClickableSearchLink(this, `View Results on Archives of Nethys`));
		}
		return content;
	}

	// #endregion

}
