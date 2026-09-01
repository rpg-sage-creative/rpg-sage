import { escapeRegex, StringMatcher } from "@rsc-utils/core-utils";
import type { SearchResults } from "./SearchResults.js";

export function sortSearchResults(searchResults: SearchResults): void {
	const searchText = searchResults.searchInfo.searchText;
	const escapedSearchText = escapeRegex(searchText);

	const stringMatcher = StringMatcher.from(searchText);
	const nameMatches = searchResults.scores.filter(score => score.searchable.matches(stringMatcher));

	const wordRegex = new RegExp(`\\b${escapedSearchText}\\b`, "i");
	const wordMatches = searchResults.scores.filter(score => !nameMatches.includes(score) && score.searchable.name.match(wordRegex));

	const partialRegex = new RegExp(escapedSearchText, "i");
	const partialMatches = searchResults.scores.filter(score => !nameMatches.includes(score) && !wordMatches.includes(score) && score.searchable.name.match(partialRegex));

	if (nameMatches.length || wordMatches.length || partialMatches.length) {
		searchResults.scores = nameMatches
			.concat(wordMatches)
			.concat(partialMatches)
			.concat(searchResults.scores.filter(score => !nameMatches.includes(score) && !wordMatches.includes(score) && !partialMatches.includes(score)));
	}
}
