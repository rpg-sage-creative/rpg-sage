import { GameSystemType } from "@rsc-sage/data-layer";
import { cleanWhitespace, SearchScore } from "@rsc-utils/core-utils";
import { GameSearchInfo } from "../../GameSearchInfo.js";
import type { TParsedSearchInfo } from "../../common.js";
import { type TResultsLink, getSearchResultsLinks, sortSearchResults } from "../index.js";
import { AonPf1SearchBase } from "./AonPf1SearchBase.js";
import { Pf1eSearchResults } from "./Pf1eSearchResults.js";

function urlRoot() {
	return "https://www.aonprd.com/";
}

export function createSearchUrl(searchText: string): string {
	const cleanSearchText = cleanWhitespace(searchText, { replacement:"+" });
	return `${urlRoot()}Search.aspx?Query=${cleanSearchText}`;
}

export function createSearchResultUrl(link: TResultsLink): string {
	const root = urlRoot();
	const cleanUrl = cleanWhitespace(link.url, { replacement:"+" }).replace(new RegExp("^" + root, "i"), "");
	return root + cleanUrl;
}

export async function searchAonPf1e(parsedSearchInfo: TParsedSearchInfo, nameOnly: boolean): Promise<Pf1eSearchResults> {
	const url = createSearchUrl(parsedSearchInfo.searchText);
	const links = await getSearchResultsLinks(url);

	const searchInfo = new GameSearchInfo(GameSystemType.PF1e, parsedSearchInfo.searchText, nameOnly ? "" : "g");
	const searchResults = new Pf1eSearchResults(searchInfo);
	links.forEach(link => searchResults.add(new SearchScore(new AonPf1SearchBase(link))));
	sortSearchResults(searchResults);

	return searchResults;
}