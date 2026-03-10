import { SearchScore } from "@rsc-utils/core-utils";
import { GameSearchInfo } from "../../GameSearchInfo.js";
import type { ParsedSearchInfo } from "../../common.js";
import { sortSearchResults } from "../../sortSearchResults.js";
import { Aon1eSearchBase } from "./Aon1eSearchBase.js";
import { Aon1eSearchResults } from "./Aon1eSearchResults.js";
import { createAon1eSearchUrl } from "./createAon1eSearchUrl.js";
import { getAon1eSearchResultsLinks } from "./getAon1eSearchResultsLinks.js";
import type { Aon1eGameSystemCode } from "./types.js";

export async function searchAon1e(gameSystem: Aon1eGameSystemCode, parsedSearchInfo: ParsedSearchInfo, nameOnly: boolean): Promise<Aon1eSearchResults> {
	const url = createAon1eSearchUrl(gameSystem, parsedSearchInfo.searchText);
	const links = gameSystem === "PF1e" ? [] : await getAon1eSearchResultsLinks(url);

	const searchInfo = new GameSearchInfo(gameSystem, parsedSearchInfo.searchText, nameOnly ? "" : "g");
	const searchResults = new Aon1eSearchResults(searchInfo);
	links.forEach(link => searchResults.add(new SearchScore(new Aon1eSearchBase(gameSystem, link))));
	sortSearchResults(searchResults);

	return searchResults;
}