import { GameSystemType } from "@rsc-sage/data-layer";
import { remove } from "@rsc-utils/core-utils";
import type { SearchResults } from "./SearchResults.js";
import { searchAon1e } from "./aon/1e/searchAon1e.js";
import { searchAon2e } from "./aon/2e/searchAon2e.js";

export type ParsedSearchInfo = {
	searchText: string;
	searchTerms: string[];
	plusTypes: string[];
	minusTypes: string[];
	plusRarities: string[];
	minusRarities: string[];
};

export function parseSearchInfo(searchTerms: string[], rarities: string[] = []): ParsedSearchInfo {
	const lowerRarities = rarities.map(rarity => rarity.toLowerCase());
	const plusTypes = remove(searchTerms, term => term.startsWith("+")).map(term => term.slice(1));
	const plusRarities = remove(plusTypes, term => findRarity(term));
	const minusTypes = remove(searchTerms, term => term.startsWith("-")).map(term => term.slice(1));
	const minusRarities = remove(minusTypes, term => findRarity(term));
	const searchText = searchTerms.join(" ");
	return { searchText, searchTerms, plusTypes, minusTypes, plusRarities, minusRarities };

	function findRarity(term: string): boolean {
		return lowerRarities.find(rarity => rarity === term || rarity[0] === term) as any;
	}
}

type TSearchSource = {
	name: string;
	search: (parsedSearchInfo:ParsedSearchInfo, nameOnly:boolean) => Promise<SearchResults>;
}

function searchAonPf1e(parsedSearchInfo: ParsedSearchInfo, nameOnly: boolean) {
	return searchAon1e("PF1e", parsedSearchInfo, nameOnly);
}
function searchAonSf1e(parsedSearchInfo: ParsedSearchInfo, nameOnly: boolean) {
	return searchAon1e("SF1e", parsedSearchInfo, nameOnly);
}
function searchAonPf2e(parsedSearchInfo: ParsedSearchInfo, nameOnly: boolean) {
	return searchAon2e("PF2e", parsedSearchInfo, nameOnly);
}
function searchAonSf2e(parsedSearchInfo: ParsedSearchInfo, nameOnly: boolean) {
	return searchAon2e("SF2e", parsedSearchInfo, nameOnly);
}

export function getSearchEngine(gameSystemType: GameSystemType): TSearchSource | null {
	switch(gameSystemType) {
		case GameSystemType.PF1e: return { name:"Archives of Nethys", search:searchAonPf1e };
		case GameSystemType.PF2e: return { name:"Archives of Nethys", search:searchAonPf2e };
		case GameSystemType.SF1e: return { name:"Archives of Nethys", search:searchAonSf1e };
		case GameSystemType.SF2e: return { name:"Archives of Nethys", search:searchAonSf2e };
		default: return null;
	}
}
