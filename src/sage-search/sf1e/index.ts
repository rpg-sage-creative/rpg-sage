// import { writeFileSync } from "fs";
import { GameType } from "../../sage-common";
import { SearchScore } from "../../sage-utils/utils/SearchUtils";
import { StringMatcher } from "../../sage-utils/utils/StringUtils";
import { GameSearchInfo } from "../GameSearchInfo";
import { TParsedSearchInfo, getAonSearchResults } from "../common";
import AonSf1SearchBase from "./AonSf1SearchBase";
import Sf1eSearchResults from "./Sf1eSearchResults";

export function createSearchUrl(searchText: string): string {
	const cleanSearchText = searchText.replace(/\s+/g, "+");
	return `https://www.aonsrd.com/Search.aspx?Query=${cleanSearchText}`;
}
export function createSearchResultUrl(link: TResultsLink): string {
	const cleanUrl = link.url.replace(/\s+/g, "+");
	return `https://www.aonprd.com/${cleanUrl}`;
}

export type TResultsLink = { cat:string; label:string; url:string; partial:boolean; exact:boolean; objectType:"Sf1eSearchResultsLink"; };
export type TResultsCat = { label:string; links:TResultsLink[]; unique:TResultsLink[]; exact:boolean; objectType:"Sf1eSearchResultsCategory"; };

function parseResultsLink(link: string): TResultsLink {
	const match = link.match(/<a\s+href="([^"]+)">(.*?)<\/a>/i) ?? [];
	const url = match[1];
	const label = match[2];
	const cat = "";
	const partial = false;
	const exact = false;
	return { cat, label, url, partial, exact, objectType:"Sf1eSearchResultsLink" };
}

function parseResultsLine(line: string): TResultsCat {
	const label = line.match(/^(?:<b>|<h1 class="title">)(.*?)(<\/b>|<\/h1>)/i)?.[1] ?? "INVALID";
	const exact = label === `Contains Exact Name Match`;
	const links = (line.match(/<a\s+href="([^"]+)">(.*?)<\/a>/ig) ?? []).map(parseResultsLink);
	links.forEach(link => { link.cat = label; link.exact = exact; });
	const unique = links.filter((link, index, array) => index === array.findIndex(l => l.url === link.url));
	return { label, links, unique, exact, objectType:"Sf1eSearchResultsCategory" };
}

function parseResultsHtml(html: string): TResultsLink[] {
	const lines = html.replace(/<h1/ig, `\n<h1`).split(/\n/).map(s => s.trim()).filter(s => s);
	// writeFileSync("../sf1e-aon-results-lines.html", lines.join("\n"));
	const categories = lines.map(parseResultsLine).filter(cat => cat.label !== "INVALID");
	// const exactCats = categories.filter(cat => cat.exact);
	const otherCats = categories.filter(cat => !cat.exact);
	const results: TResultsLink[] = [];
	if (categories.find(cat => cat.exact)) {
		const addedUrls: string[] = [];
		otherCats.forEach(cat => {
			cat.links.forEach(link => {
				if (!addedUrls.includes(link.url)) {
					results.push(link);
					addedUrls.push(link.url);
				}
			});
		});
	}
	// writeFileSync("../sf1e-aon-results.json", JSON.stringify(results));
	return results;
}

export async function searchAonSf1e(parsedSearchInfo: TParsedSearchInfo, nameOnly: boolean): Promise<Sf1eSearchResults> {
	const url = createSearchUrl(parsedSearchInfo.searchText);
	const resultsHtml = await getAonSearchResults(url);
	const links = parseResultsHtml(resultsHtml);

	const searchInfo = new GameSearchInfo(GameType.SF1e, parsedSearchInfo.searchText, nameOnly ? "" : "g");
	const searchResults = new Sf1eSearchResults(searchInfo);
	links.forEach(link => searchResults.add(new SearchScore(new AonSf1SearchBase(link))));

	// #region perfect match resort

	const stringMatcher = StringMatcher.from(searchInfo.searchText);
	const nameMatches = searchResults.scores.filter(score => score.searchable.matches(stringMatcher));
	const wordRegex = new RegExp(`\b${searchInfo.searchText}\b`, "i");
	const wordMatches = searchResults.scores.filter(score => !nameMatches.includes(score) && score.searchable.name.match(wordRegex));
	const partialRegex = new RegExp(searchInfo.searchText, "i");
	const partialMatches = searchResults.scores.filter(score => !nameMatches.includes(score) && !wordMatches.includes(score) && score.searchable.name.match(partialRegex));
	if (nameMatches.length || wordMatches.length || partialMatches.length) {
		searchResults.scores = nameMatches
			.concat(wordMatches)
			.concat(partialMatches)
			.concat(searchResults.scores.filter(score => !nameMatches.includes(score) && !wordMatches.includes(score) && !partialMatches.includes(score)));
	}

	// #endregion

	return searchResults;
}