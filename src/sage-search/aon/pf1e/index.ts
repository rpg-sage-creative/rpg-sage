import { SearchScore } from "@rsc-utils/search-utils";
import { TResultsLink, getSearchResultsLinks, sortSearchResults } from "../";
import { GameType } from "../../../sage-common";
import { GameSearchInfo } from "../../GameSearchInfo";
import type { TParsedSearchInfo } from "../../common";
import { AonPf1SearchBase } from "./AonPf1SearchBase";
import { Pf1eSearchResults } from "./Pf1eSearchResults";

export function createSearchUrl(searchText: string): string {
	const cleanSearchText = searchText.replace(/\s+/g, "+");
	return `https://www.aonprd.com/Search.aspx?Query=${cleanSearchText}`;
}
export function createSearchResultUrl(link: TResultsLink): string {
	const cleanUrl = link.url.replace(/\s+/g, "+");
	return `https://www.aonprd.com/${cleanUrl}`;
}

export async function searchAonPf1e(parsedSearchInfo: TParsedSearchInfo, nameOnly: boolean): Promise<Pf1eSearchResults> {
	const url = createSearchUrl(parsedSearchInfo.searchText);
	const links = await getSearchResultsLinks(url);

	const searchInfo = new GameSearchInfo(GameType.PF1e, parsedSearchInfo.searchText, nameOnly ? "" : "g");
	const searchResults = new Pf1eSearchResults(searchInfo);
	links.forEach(link => searchResults.add(new SearchScore(new AonPf1SearchBase(link))));
	sortSearchResults(searchResults);

	return searchResults;
}