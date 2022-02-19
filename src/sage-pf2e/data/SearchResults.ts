import utils from "../../sage-utils";
import ScoredMenu from "./ScoredMenu";
import type Base from "../model/base/Base";

function createLabel(searchInfo: utils.SearchUtils.SearchInfo, objectType?: string): string {
	const prefix = objectType ? `${objectType} ` : ``;
	const suffix = searchInfo.keyTerm ? ` \\${searchInfo.keyTerm}` : ``;
	return `${prefix}Search Results for: \`${searchInfo.searchText + suffix}\``;
}

function createAonLink(term: string): string {
	return `<a href="http://2e.aonprd.com/Search.aspx?query=${term.replace(/\s+/g, "+")}">Search Archives of Nethys</a>`;
}

export default class SearchResults<T extends Base> extends ScoredMenu<T> {

	public constructor(public searchInfo: utils.SearchUtils.SearchInfo, public objectType?: string) {
		super(createLabel(searchInfo, objectType));
	}

	// #region Public Properties

	public get term() {
		return this.searchInfo.searchText;
	}

	public get theMatch() {
		const stringMatcher = utils.StringUtils.StringMatcher.from(this.searchInfo.searchText),
			matches = this.searchables.filter(obj => obj.matches(stringMatcher));
		return matches.length === 1 && matches[0] || null;
	}

	// #endregion

	// #region DiscordUtils.IMenuRenderable

	public toMenuRenderableContent(indexes: number[]): utils.RenderUtils.RenderableContent {
		const content = super.toMenuRenderableContent(indexes);
		if (indexes.length === 0 && !this.theOne) {
			content.appendSection(createAonLink(this.term));
		}
		return content;
	}

	// #endregion

	// #region utils.RenderUtils.IRenderable

	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		const content = super.toRenderableContent();
		if (this.isEmpty) {
			content.appendSection(createAonLink(this.term));
		}
		return content;
	}

	// #endregion
}
