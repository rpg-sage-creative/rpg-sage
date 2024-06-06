import { getText } from "@rsc-utils/https-utils";
import { stringify } from "@rsc-utils/core-utils";
import { StringMatcher } from "@rsc-utils/string-utils";
import { existsSync, readFileSync, writeFileSync } from "fs";
import XRegExp from "xregexp";
import type { SearchResults } from "../SearchResults.js";

export type TResultsLink = {
	cat: string;
	label: string;
	url: string;
	partial: boolean;
	exact: boolean;
	objectType: "AonSearchResultsLink";
};

export type TResultsCat = {
	label: string;
	links: TResultsLink[];
	unique: TResultsLink[];
	exact: boolean;
	objectType: "AonSearchResultsCategory";
};

async function getOrCreateHtmlCache(url: string): Promise<string> {
	const cleanUrl = url.replace(/\W/g, "");
	const filePath = `../${cleanUrl}.full.html`;
	if (existsSync(filePath)) {
		return readFileSync(filePath).toString();
	}

	const html = await getText(url);
	writeFileSync(filePath, html);
	return html;
}

async function getOrCreateAonSearchResultsCache(url: string): Promise<string> {
	const cleanUrl = url.replace(/\W/g, "");
	const filePath = `../${cleanUrl}.results.html`;
	if (existsSync(filePath)) {
		return readFileSync(filePath).toString();
	}

	const html = await getOrCreateHtmlCache(url),
		resultsHtml = parseAonSearchResults(html);
	writeFileSync(filePath, resultsHtml);
	return resultsHtml;
}

function parseAonSearchResults(html: string): string {
	const startString = `<span id="ctl00_MainContent_SearchOutput">`,
		startIndex = html.indexOf(startString) + startString.length,
		stopString = `</span>`,
		stopIndex = html.indexOf(stopString, startIndex);
	return html.slice(startIndex, stopIndex);
}

function parseResultsLink(link: string): TResultsLink {
	const match = link.match(/<a\s+href="([^"]+)">(.*?)<\/a>/i) ?? [];
	const url = match[1];
	const label = match[2];
	const cat = "";
	const partial = false;
	const exact = false;
	return { cat, label, url, partial, exact, objectType:"AonSearchResultsLink" };
}

function parseResultsLine(line: string): TResultsCat {
	const label = line.match(/^(?:<b>|<h1 class="title">)(.*?)(<\/b>|<\/h1>)/i)?.[1] ?? "INVALID";
	const exact = label === `Contains Exact Name Match` || label === `Contains Exact Name Matches`;
	const links = (line.match(/<a\s+href="([^"]+)">(.*?)<\/a>/ig) ?? []).map(parseResultsLink);
	links.forEach(link => { link.cat = label; link.exact = exact; });
	const unique = links.filter((link, index, array) => index === array.findIndex(l => l.url === link.url));
	return { label, links, unique, exact, objectType:"AonSearchResultsCategory" };
}

function parseResultsHtml(html: string, writeDevCache: boolean): TResultsLink[] {
	if (writeDevCache) {
		writeFileSync("../aon-results-lines.html", html);
	}
	const categories = html
		.replace(/<h1/ig, `\n<h1`)
		.split(/\n/)
		.map(s => s.trim())
		.filter(s => s)
		.map(parseResultsLine)
		.filter(cat => cat.label !== "INVALID" && !cat.exact);
	const results: TResultsLink[] = [];
	const addedUrls: string[] = [];
	categories.forEach(cat => {
		cat.links.forEach(link => {
			if (!addedUrls.includes(link.url)) {
				results.push(link);
				addedUrls.push(link.url);
			}
		});
	});
	if (writeDevCache) {
		writeFileSync("../aon-results.json", stringify(results));
	}
	return results;
}

export async function getSearchResultsLinks(url: string, useDevCache = false): Promise<TResultsLink[]> {
	const html = useDevCache
		? await getOrCreateAonSearchResultsCache(url)
		: parseAonSearchResults(await getText(url));
	return parseResultsHtml(html, useDevCache);
}

export function sortSearchResults(searchResults: SearchResults): void {
	const searchText = searchResults.searchInfo.searchText;
	const escapedSearchText = XRegExp.escape(searchText);

	const stringMatcher = StringMatcher.from(searchText);
	const nameMatches = searchResults.scores.filter(score => score.searchable.matches(stringMatcher));

	const wordRegex = new RegExp(`\b${escapedSearchText}\b`, "i");
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
