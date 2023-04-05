import { GameType } from "../../../sage-common";
import type { AonBase } from "../../../sage-pf2e/model/base/AonBase";
import { sortAscending, sortDescending } from "../../../sage-utils/ArrayUtils";
// import { writeFileSync } from "../../../sage-utils/FsUtils";
import { getJson } from "../../../sage-utils/HttpsUtils";
import { allToUS } from "../../../sage-utils/LangUtils";
import type { SearchScore } from "../../../sage-utils/SearchUtils";
import { StringMatcher } from "../../../sage-utils/StringUtils";
import { GameSearchInfo } from "../../GameSearchInfo";
import type { TParsedSearchInfo } from "../../common";
import { Pf2eSearchResults } from "./Pf2eSearchResults";
import type { TPostData, TResponseData } from "./types";

const PF2E_SEARCH_URL = `https://elasticsearch.aonprd.com/aon/_search`;

export function createSearchUrl(searchText: string): string | null {
	const cleanSearchText = searchText.replace(/\s+/g, "+");
	return `https://2e.aonprd.com/Search.aspx?query=${cleanSearchText}`;
}

export async function searchAonPf2e(parsedSearchInfo: TParsedSearchInfo, nameOnly: boolean): Promise<Pf2eSearchResults> {
	const searchInfo = new GameSearchInfo(GameType.PF2e, parsedSearchInfo.searchText, nameOnly ? "" : "g");

	const terms = allToUS(searchInfo.terms.map(term => term.term));
	const responseDataMust = null as TResponseData | null; // await getResponseJson(terms, "must");
	const responseDataShould = responseDataMust?.hits.total.value ? null : await getResponseJson(terms, "should");

	const searchResults = new Pf2eSearchResults(searchInfo, responseDataShould ?? responseDataMust);
	/** @todo run a "must" search before running a "should" search and splice the results with "must" results at the top */

	//#region type shuffle

	const types = ensurePlusMinusTypes(parsedSearchInfo.plusTypes, parsedSearchInfo.minusTypes);
	const rarities = { plus:parsedSearchInfo.plusRarities, minus:parsedSearchInfo.minusRarities };
	searchResults.scores.sort((a: TScore, b: TScore) => sortResults(a, b, types, rarities));

	//#endregion

	// #region perfect match resort

	const stringMatcher = StringMatcher.from(searchInfo.searchText);
	const nameMatches = searchResults.scores.filter(score => score.searchable.matches(stringMatcher));
	if (nameMatches.length) {
		searchResults.scores = nameMatches.concat(searchResults.scores.filter(score => !nameMatches.includes(score)));
	}

	// #endregion

	return searchResults;
}

function cleanSpaces(terms: string | string[]): string {
	return (Array.isArray(terms) ? terms.join(" ") : terms).replace(/\s+/g, " ");
}

function buildPostData(terms: string[], shouldMust: "should" | "must"): TPostData {
	const cleanTerms = cleanSpaces(terms);
	const postData: TPostData = {
		query: {
			bool: {
				should: [
					{ match_phrase_prefix: { name: { query:cleanTerms } } },
					{ bool: { } }
				],
				minimum_should_match: 1
			}
		},
		sort: ["_score", "_doc"]
	};
	const multiMatchTerms = shouldMust === "must" ? [cleanTerms] : terms;
	postData.query.bool.should[1].bool[shouldMust] = multiMatchTerms.map(term => {
		return {
			multi_match: {
				query: cleanSpaces(term),
				type: "best_fields",
				fields: ["name", "text^0.1", "trait_raw", "type"],
				fuzziness: "auto"
			}
		};
	});
	/*
	// If we decide to filter/exclude types at the search engine ...
	// if (plusTypes) {
	// 	postData.query.bool.filter = [ { terms: { type:plusTypes } } ];
	// }
	// if (minusTypes) {
	// 	postData.query.bool.must_not = [ { terms: { type:minusTypes } } ];
	// }
	*/
	return postData;
}

async function getResponseJson(terms: string[], shouldMust: "should" | "must"): Promise<TResponseData | null> {
	const postData = buildPostData(terms, shouldMust);
	// writeFileSync(`../pf2e-request-${shouldMust}.json`, postData);
	const response: TResponseData | null = await getJson(PF2E_SEARCH_URL, postData).catch(e => console.error(e)! || null);
	// writeFileSync(`../pf2e-response-${shouldMust}.json`, response);
	return response;

}

//#region SearchResults sorting

type TScore = SearchScore<AonBase>;

type TPlusMinus = { plus:string[]; minus:string[]; };

const defaultPlusTypes = [] as string[];
const defaultMinusTypes = ["item", "source", "rules", "creature"];

function ensurePlusMinusTypes(plus: string[], minus: string[]): TPlusMinus {
	// start with user plus list
	plus = plus
		// add default plus list (excluding those in user plus/minus lists)
		.concat(defaultPlusTypes.filter(type => !plus.includes(type) && !minus.includes(type)));

	// start with default list
	minus = defaultMinusTypes
		// remove any in the minus list to ...
		.filter(type => !minus.includes(type))
		// put the minus list lower in the rankings
		.concat(minus)
		// remove the plus list
		.filter(type => !plus.includes(type));

	return { plus, minus };
}

function sort(aValue: string, bValue: string, plusMinus: TPlusMinus, plus: boolean): -1 | 0 | 1 {
	const sorter = plus ? sortDescending : sortAscending,
		array = plusMinus[plus ? "plus" : "minus"],
		aIndex = array.indexOf(aValue),
		bIndex = array.indexOf(bValue);
	return sorter(aIndex, bIndex);
}

// function sortResults(a: TScore, b: TScore, types: TPlusMinus, rarities: TPlusMinus): -1 | 0 | 1 {
function sortResults(a: TScore, b: TScore, types: TPlusMinus, _: TPlusMinus): -1 | 0 | 1 {
	return sort(a.searchable.objectTypeLower, b.searchable.objectTypeLower, types, true)
		// || sort(a.searchable.rarityLower, b.searchable.rarityLower, rarities, true)
		// || sort(a.searchable.rarityLower, b.searchable.rarityLower, rarities, false)
		|| sort(a.searchable.objectTypeLower, b.searchable.objectTypeLower, types, false)
		|| sortDescending(a.totalHits, b.totalHits)
		|| sortAscending(a.searchable.name, b.searchable.name);
}

//#endregion
