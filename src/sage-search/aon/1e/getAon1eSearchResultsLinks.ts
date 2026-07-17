import { DataTable } from "@rsc-sage/data-layer";
import { stringifyJson, warn } from "@rsc-utils/core-utils";
import { getText } from "@rsc-utils/io-utils";
import type { Aon1eSearchResultsCat, Aon1eSearchResultsLink } from "./types.js";

const NonWordCharRegExpG = /\W/g;

async function getSearchResults(url: string): Promise<string> {
	return await getText(url)
		.catch(ex => warn(ex) as any || "");
}

async function getOrCreateHtmlCache(url: string): Promise<string> {
	const cleanUrl = url.replace(NonWordCharRegExpG, "");
	const fileName = `${cleanUrl}.full.html`;

	let html = await DataTable.readSearchHtmlCache(fileName);
	if (!html) {
		html = await getSearchResults(url);
		await DataTable.writeSearchHtmlCache(fileName, html);
	}

	return html;
}

async function getOrCreateAonSearchResultsCache(url: string): Promise<string> {
	const cleanUrl = url.replace(NonWordCharRegExpG, "");
	const fileName = `${cleanUrl}.results.html`;

	let resultsHtml = await DataTable.readSearchHtmlCache(fileName);
	if (!resultsHtml) {
		resultsHtml = parseAonSearchResults(await getOrCreateHtmlCache(url));
		await DataTable.writeSearchHtmlCache(fileName, resultsHtml);
	}

	return resultsHtml;
}

function parseAonSearchResults(html: string): string {
	const startString = `<span id="ctl00_MainContent_SearchOutput">`,
		startIndex = html.indexOf(startString) + startString.length,
		stopString = `</span>`,
		stopIndex = html.indexOf(stopString, startIndex);
	return html.slice(startIndex, stopIndex);
}

const LinkRegExp = /<a\s+href="([^"]+)">(.*?)<\/a>/i;
const LinkRegExpG = /<a\s+href="([^"]+)">(.*?)<\/a>/ig;

function parseResultsLink(link: string): Aon1eSearchResultsLink {
	const match = link.match(LinkRegExp) ?? [];
	const url = match[1];
	const label = match[2];
	const cat = "";
	const partial = false;
	const exact = false;
	return { cat, label, url, partial, exact, objectType:"Aon1eSearchResultsLink" };
}

const LineLabelRegExp = /^(?:<b>|<h1 class="title">)(.*?)(<\/b>|<\/h1>)/i;

function parseResultsLine(line: string): Aon1eSearchResultsCat {
	const label = line.match(LineLabelRegExp)?.[1] ?? "INVALID";
	const exact = label === `Contains Exact Name Match` || label === `Contains Exact Name Matches`;
	const links = (line.match(LinkRegExpG) ?? []).map(parseResultsLink);
	links.forEach(link => { link.cat = label; link.exact = exact; });
	const unique = links.filter((link, index, array) => index === array.findIndex(l => l.url === link.url));
	return { label, links, unique, exact, objectType:"Aon1eSearchResultsCategory" };
}

async function parseResultsHtml(html: string, writeDevCache: boolean): Promise<Aon1eSearchResultsLink[]> {
	if (writeDevCache) {
		await DataTable.writeSearchHtmlCache("aon-results-lines.html", html);
	}
	const categories = html
		.replaceAll("<h1", `\n<h1`)
		.replaceAll("<H1", `\n<h1`)
		.split("\n")
		.map(s => s.trim())
		.filter(s => s)
		.map(parseResultsLine)
		.filter(cat => cat.label !== "INVALID" && !cat.exact);
	const results: Aon1eSearchResultsLink[] = [];
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
		await DataTable.writeSearchHtmlCache("aon-results.json", stringifyJson(results));
	}
	return results;
}

export async function getAon1eSearchResultsLinks(url: string, useDevCache = false): Promise<Aon1eSearchResultsLink[]> {
	const html = useDevCache
		? await getOrCreateAonSearchResultsCache(url)
		: parseAonSearchResults(await getSearchResults(url));
	return await parseResultsHtml(html, useDevCache);
}
