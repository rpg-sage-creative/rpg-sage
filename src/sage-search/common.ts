import { GameType } from "../sage-common";
import { createSearchUrl as createSearchUrlPf1e } from "./pf1e";
import { createSearchUrl as createSearchUrlPf2e } from "./pf2e";
import { createSearchUrl as createSearchUrlSf1e } from "./sf1e";
import type { Collection } from "../sage-utils/utils/ArrayUtils";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { getText } from "../sage-utils/utils/HttpsUtils";

export function createSearchUrl(gameType: GameType, searchText: string): string | null {
	switch (gameType) {
		case GameType.SF1e:
			return createSearchUrlSf1e(searchText);
		case GameType.PF1e:
			return createSearchUrlPf1e(searchText);
		case GameType.PF2e:
			return createSearchUrlPf2e(searchText);
		default:
			return null;
	}
}

export function createClickableSearchLink(gameType: GameType, searchText: string, label: string): string {
	const url = createSearchUrl(gameType, searchText);
	return `<a href="${url}">${label}</a>`;
}

export type TParsedSearchInfo = {
	searchText: string;
	searchTerms: string[];
	plusTypes: string[];
	minusTypes: string[];
	plusRarities: string[];
	minusRarities: string[];
};

export function parseSearchInfo(searchTerms: Collection<string>, rarities: string[] = []): TParsedSearchInfo {
	const lowerRarities = rarities.map(rarity => rarity.toLowerCase());
	const plusTypes = searchTerms.remove(term => term.startsWith("+")).map(term => term.slice(1));
	const plusRarities = plusTypes.remove(term => findRarity(term));
	const minusTypes = searchTerms.remove(term => term.startsWith("-")).map(term => term.slice(1));
	const minusRarities = minusTypes.remove(term => findRarity(term));
	const searchText = searchTerms.map(term => term.match(/\s+/) ? `"${term}"` : term).join(" ");
	return { searchText, searchTerms, plusTypes, minusTypes, plusRarities, minusRarities };

	function findRarity(term: string): boolean {
		return lowerRarities.find(rarity => rarity === term || rarity[0] === term) as any;
	}
}

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

export async function getAonSearchResults(url: string, useDevCache = false): Promise<string> {
	if (useDevCache) {
		return getOrCreateAonSearchResultsCache(url);
	}
	return parseAonSearchResults(await getText(url));
}