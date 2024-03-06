import { SearchScore } from "@rsc-utils/search-utils";
import { TResultsLink, getSearchResultsLinks, sortSearchResults } from "../index.js";
import { GameType } from "../../../sage-common/index.js";
import { GameSearchInfo } from "../../GameSearchInfo.js";
import type { TParsedSearchInfo } from "../../common.js";
import { AonSf1SearchBase } from "./AonSf1SearchBase.js";
import { Sf1eSearchResults } from "./Sf1eSearchResults.js";

export function createSearchUrl(searchText: string): string {
	const cleanSearchText = searchText.replace(/\s+/g, "+");
	return `https://www.aonsrd.com/Search.aspx?Query=${cleanSearchText}`;
}
export function createSearchResultUrl(link: TResultsLink): string {
	const cleanUrl = link.url.replace(/\s+/g, "+");
	return `https://www.aonsrd.com/${cleanUrl}`;
}

export async function searchAonSf1e(parsedSearchInfo: TParsedSearchInfo, nameOnly: boolean): Promise<Sf1eSearchResults> {
	const url = createSearchUrl(parsedSearchInfo.searchText);
	const links = await getSearchResultsLinks(url);

	const searchInfo = new GameSearchInfo(GameType.SF1e, parsedSearchInfo.searchText, nameOnly ? "" : "g");
	const searchResults = new Sf1eSearchResults(searchInfo);
	links.forEach(link => searchResults.add(new SearchScore(new AonSf1SearchBase(link))));
	sortSearchResults(searchResults);

	return searchResults;
}