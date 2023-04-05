import { GameType } from "../sage-common";
import { remove } from "../sage-utils/ArrayUtils";
import type { SearchResults } from "./SearchResults";
import { searchAonPf1e, searchAonPf2e, searchAonSf1e } from "./aon";

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
	const searchText = searchTerms.map(term => term.match(/\s+/) ? `"${term}"` : term).join(" ");
	return { searchText, searchTerms, plusTypes, minusTypes, plusRarities, minusRarities };

	function findRarity(term: string): boolean {
		return lowerRarities.find(rarity => rarity === term || rarity[0] === term) as any;
	}
}

type TSearchSource = {
	name: string;
	search: (parsedSearchInfo:TParsedSearchInfo, nameOnly:boolean) => Promise<SearchResults>;
}

export function getSearchEngine(gameType: GameType): TSearchSource | null {
	switch(gameType) {
		case GameType.PF1e: return { name:"Archives of Nethys", search:searchAonPf1e };
		case GameType.PF2e: return { name:"Archives of Nethys", search:searchAonPf2e };
		case GameType.SF1e: return { name:"Archives of Nethys", search:searchAonSf1e };
		default: return null;
	}
}
