import utils, { IRenderable, ISearchable } from "../../../sage-utils";
import type { IMenuRenderable } from "../../discord";
import { DiscordMaxValues, UNICODE_A_TO_Z, UNICODE_ZERO_TO_TEN } from "../../discord";

interface IRenderableSearchable extends ISearchable, IRenderable { }
export default class CategorizedMenu<T extends IRenderableSearchable> extends utils.SearchUtils.HasCategorizedSearchables<T> implements IMenuRenderable {

	public constructor(public label: string) { super(); }

	// #region utils.DiscordUtils.IMenuRenderable

	public getMenuLength(indexes: number[]): number {
		if (this.theOne) return 1;

		const max = DiscordMaxValues.message.reactionCount;
		if (indexes.length === 0) return Math.min(this.categoryCount, max);

		const categorized = this.categorizedSearchables[indexes[0]];
		if (indexes.length === 1) return Math.min(categorized.children.length, max);

		const letterized = categorized.children[indexes[1]];
		if (indexes.length === 2) return Math.min(letterized.searchables.length, max);

		return letterized.searchables[indexes[2]] && 1 || 0;
	}
	public getMenuUnicodeArray(indexes: number[]): string[] {
		let menuLength = this.getMenuLength(indexes);
		if (indexes.length === 1) {
			let letterIndexes = this.categorizedSearchables[indexes[0]].children.map(letter => letter.label.toLowerCase().charCodeAt(0) - 97);
			return UNICODE_A_TO_Z.filter((_, i) => letterIndexes.includes(i)).slice(0, menuLength);
		}
		let unicodeArray = UNICODE_ZERO_TO_TEN;
		// if (indexes.length === 2 && menuLength > unicodeArray.length) {
		// 	unicodeArray = utils.DiscordUtils.UNICODE_A_TO_Z;
		// }
		return unicodeArray.slice(0, menuLength);
	}
	public toMenuRenderableContent(indexes: number[]): utils.RenderUtils.RenderableContent {
		if (this.theOne) return this.theOne.toRenderableContent();
		let content = new utils.RenderUtils.RenderableContent();
		if (indexes.length === 0) {
			let unicodeArray = this.getMenuUnicodeArray(indexes),
				unicodeIndex = 0;
			content.setTitle(`<b>${this.label}</b>`);
			content.append(`<b>Total (${this.searchableCount})</b>`);
			this.categorizedSearchables.forEach(cat => {
				content.append(`${unicodeArray[unicodeIndex++] || ""} ${cat.label.bold()}: (${cat.searchables.length}) ` + cat.searchables.map(item => item.toSearchResult()).join(", "));
				// content.append(`${unicodeArray[unicodeIndex++] || ""} ${cat.label.bold()}: (${cat.searchables.length})`, "> " + cat.searchables.map(item => item.toSearchResult()).join(", "));
			});
		} else if (indexes.length === 1) {
			let categorized = this.categorizedSearchables[indexes[0]],
				unicodeArray = this.getMenuUnicodeArray(indexes),
				unicodeIndex = 0;
			content.setTitle(`<b>${this.label}</b>`);
			content.append(`<b>Total (${this.searchableCount})</b>`);
			content.append(`<b>${categorized.label} (${categorized.searchables.length})</b>`);
			categorized.children.forEach(letter => {
				content.append(`${unicodeArray[unicodeIndex++] || ""} ${letter.label.bold()}: (${letter.searchables.length}) ` + letter.searchables.map(item => item.toSearchResult()).join(", "));
				// content.append(`${unicodeArray[unicodeIndex++] || ""} ${letter.label.bold()}: (${letter.searchables.length})`, "> " + letter.searchables.map(item => item.toSearchResult()).join(", "));
			});
		} else if (indexes.length === 2) {
			let categorized = this.categorizedSearchables[indexes[0]],
				letterized = categorized.children[indexes[1]],
				searchableCount = letterized.searchables.length,
				unicodeArray = this.getMenuUnicodeArray(indexes),
				unicodeIndex = 0;
			content.setTitle(`<b>${this.label}</b>`);
			content.append(`<b>Total (${this.searchableCount})</b>`);
			content.append(`<b>${categorized.label} (${categorized.searchables.length})</b>`);
			content.append(`<b>${letterized.label} (${searchableCount})</b>`);
			// content.append(`> ` + letterized.searchables.map(item => `${unicodeArray[unicodeIndex++] || ""} ${item.toSearchResult()}`).join(", "));
			letterized.searchables.forEach(item => {
				content.append(`> ${unicodeArray[unicodeIndex++] || ""} ${item.toSearchResult()}`);
			});
		} else {
			content = this.categorizedSearchables[indexes[0]].children[indexes[1]].searchables[indexes[2]].toRenderableContent();
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
			this.categorizedSearchables.forEach(cat => {
				content.append(`<b>${cat.label} (${cat.searchables.length}):</b> ${cat.searchables.slice(0, 10).map(item => item.toSearchResult()).join(", ")}${cat.searchables.length > 10 ? " ..." : ""}`);
			});
		}
		return content;
	}
	// #endregion
}
