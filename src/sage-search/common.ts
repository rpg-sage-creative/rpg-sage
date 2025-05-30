import { GameSystemType } from "@rsc-sage/types";
import { getWhitespaceRegex, remove } from "@rsc-utils/core-utils";
import type { SearchResults } from "./SearchResults.js";
import { searchAonPf1e } from "./aon/pf1e/index.js";
import { searchAonPf2e } from "./aon/pf2e/index.js";
import { searchAonSf1e } from "./aon/sf1e/index.js";

export type TParsedSearchInfo = {
	searchText: string;
	searchTerms: string[];
	plusTypes: string[];
	minusTypes: string[];
	plusRarities: string[];
	minusRarities: string[];
};

export function parseSearchInfo(searchTerms: string[], rarities: string[] = []): TParsedSearchInfo {
	const lowerRarities = rarities.map(rarity => rarity.toLowerCase());
	const plusTypes = remove(searchTerms, term => term.startsWith("+")).map(term => term.slice(1));
	const plusRarities = remove(plusTypes, term => findRarity(term));
	const minusTypes = remove(searchTerms, term => term.startsWith("-")).map(term => term.slice(1));
	const minusRarities = remove(minusTypes, term => findRarity(term));
	const spaceRegex = getWhitespaceRegex();
	const searchText = searchTerms.map(term => spaceRegex.test(term) ? `"${term}"` : term).join(" ");
	return { searchText, searchTerms, plusTypes, minusTypes, plusRarities, minusRarities };

	function findRarity(term: string): boolean {
		return lowerRarities.find(rarity => rarity === term || rarity[0] === term) as any;
	}
}

type TSearchSource = {
	name: string;
	search: (parsedSearchInfo:TParsedSearchInfo, nameOnly:boolean) => Promise<SearchResults>;
}

export function getSearchEngine(gameSystemType: GameSystemType): TSearchSource | null {
	switch(gameSystemType) {
		case GameSystemType.PF1e: return { name:"Archives of Nethys", search:searchAonPf1e };
		case GameSystemType.PF2e: return { name:"Archives of Nethys", search:searchAonPf2e };
		case GameSystemType.SF1e: return { name:"Archives of Nethys", search:searchAonSf1e };
		default: return null;
	}
}
