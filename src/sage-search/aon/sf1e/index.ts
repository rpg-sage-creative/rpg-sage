import { SearchScore } from "@rsc-utils/core-utils";
import { GameSystemType } from "@rsc-utils/game-utils";
import { GameSearchInfo } from "../../GameSearchInfo.js";
import type { TParsedSearchInfo } from "../../common.js";
import { type TResultsLink, getSearchResultsLinks, sortSearchResults } from "../index.js";
import { AonSf1SearchBase } from "./AonSf1SearchBase.js";
import { Sf1eSearchResults } from "./Sf1eSearchResults.js";

function urlRoot() {
	return "https://www.aonsrd.com/";
}

const WS = /\s+/g;

export function createSearchUrl(searchText: string): string {
	const cleanSearchText = searchText.replace(WS, "+");
	return `${urlRoot()}Search.aspx?Query=${cleanSearchText}`;
}

export function createSearchResultUrl(link: TResultsLink): string {
	const root = urlRoot();
	const cleanUrl = link.url.replace(WS, "+").replace(new RegExp("^" + root, "i"), "");
	return root + cleanUrl;
}

export async function searchAonSf1e(parsedSearchInfo: TParsedSearchInfo, nameOnly: boolean): Promise<Sf1eSearchResults> {
	const url = createSearchUrl(parsedSearchInfo.searchText);
	const links = await getSearchResultsLinks(url);

	const searchInfo = new GameSearchInfo(GameSystemType.SF1e, parsedSearchInfo.searchText, nameOnly ? "" : "g");
	const searchResults = new Sf1eSearchResults(searchInfo);
	links.forEach(link => searchResults.add(new SearchScore(new AonSf1SearchBase(link))));
	sortSearchResults(searchResults);

	return searchResults;
}
