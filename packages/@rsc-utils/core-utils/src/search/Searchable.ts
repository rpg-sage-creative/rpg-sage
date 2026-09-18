import type { SearchInfo } from "./SearchInfo.js";
import type { SearchScore } from "./SearchScore.js";

interface SearchableSource {
	code?: string;
};

export interface Searchable {
	name: string;
	searchResultCategory: string;
	source?: SearchableSource;
	search(searchInfo: SearchInfo): SearchScore<Searchable>;
	searchRecursive(searchInfo: SearchInfo): SearchScore<Searchable>[];
	toSearchResult(): string;
}
