import type { SearchInfo, SearchScore } from ".";

//#region index.ts

export interface ISearchable {
	name: string;
	searchResultCategory: string;
	search(searchInfo: SearchInfo): SearchScore<ISearchable>;
	searchRecursive(searchInfo: SearchInfo): SearchScore<ISearchable>[];
	toSearchResult(): string;
}

//#endregion
