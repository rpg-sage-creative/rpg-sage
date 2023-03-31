import type { SearchInfo } from "./SearchInfo";
import type { SearchScore } from "./SearchScore";

/** This represents an object that has searchable contents. */
export interface ISearchable {
	/** the name of the searchable object */
	name: string;

	/** the category of results this searchable object should appear in */
	searchResultCategory: string;

	/** performs a search of the object */
	search(searchInfo: SearchInfo): SearchScore<ISearchable>;

	/** performs a search of the object and its children */
	searchRecursive(searchInfo: SearchInfo): SearchScore<ISearchable>[];

	/** the text that should represent this object in a list of search results */
	toSearchResult(): string;
}

export type TSearchTermMeta = {
	/** The term (word) to search, converted to US English. */
	term: string;

	/** the regex to find the term */
	regex: RegExp | null;

	/** indicates a higher ranked term @todo consider requirement */
	plus: boolean;

	/** indicates an lower ranked term @todo consider exclusion */
	minus: boolean;
};
