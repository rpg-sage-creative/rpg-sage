import { addCommas, RenderableContent } from "@rsc-utils/core-utils";
import { SearchResults } from "../../SearchResults.js";
import type { AonSf1SearchBase } from "./AonSf1SearchBase.js";
import { createSearchUrl } from "./index.js";

function createClickableSearchLink(searchResults: Sf1eSearchResults, label: string): string {
	const url = createSearchUrl(searchResults.searchInfo.searchText);
	return `<a href="${url}">${label}</a>`;
}

export class Sf1eSearchResults extends SearchResults<AonSf1SearchBase> {

	protected createRenderable(): RenderableContent {
		// const labelPrefix = this.objectType ? `${this.objectType} ` : ``;
		// const labelSuffix = this.searchInfo.keyTerm ? ` \\${this.searchInfo.keyTerm}` : ``;
		// const label = `${labelPrefix}Search Results for: \`${this.searchInfo.searchText + labelSuffix}\``;
		const label = `Starfinder Search Results for: \`${this.searchInfo.searchText}\``;

		const title = this.isEmpty ? `<b>${label}</b> not found!` : `<b>${label}</b>`;

		const content = new RenderableContent(title);
		if (!this.isEmpty) {
			content.append(`<b>First ${this.getMenuLength()} Matches</b> (of ${addCommas(this.scores.length)})`);
		}
		return content;
	}

	public get theOne(): AonSf1SearchBase | null { return null; }
	public get theMatch(): AonSf1SearchBase | null { return null; }

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
			content.append(createClickableSearchLink(this, `Search Archives of Nethys Directly`));
		}else {
			content.append(...this.scores.slice(0, this.getMenuLength()).map(score => score.searchable.toSearchResult()));
			content.append(createClickableSearchLink(this, `View Results on Archives of Nethys`));
		}
		return content;
	}

	// #endregion

}
