import { Collection, RenderableContent } from "@rsc-utils/core-utils";
import { type Base, RARITIES } from "../../../sage-pf2e/index.js";
import type { SearchResults } from "../../../sage-search/SearchResults.js";
import { getSearchEngine, parseSearchInfo } from "../../../sage-search/common.js";
import { deleteMessages } from "../../discord/deletedMessages.js";
import type { SageMessage } from "../model/SageMessage.js";

function theOneOrMatchToSage(searchResults: SearchResults<any>, match = false): Base | null {
	const aon = searchResults.theOne ?? (match ? searchResults.theMatch : null);
	if (aon) {
		const searchables = searchResults.searchables,
			index = searchables.indexOf(aon),
			sage = searchResults.sageSearchables[index];
		return sage ?? null;
	}
	return null;
}

async function invalidGame(sageMessage: SageMessage): Promise<void> {
	const unableSearchResults = new RenderableContent(`<b>Cannot Perform Search</b>`);
	unableSearchResults.append(`Currently, we can only search Pathfinder or Starfinder content. Please set your channel, game, or server to Pathfinder or Starfinder if you would like to enable searching for content.`);
	unableSearchResults.append(`<br/>Example:`);
	unableSearchResults.append(`<code>sage! channel update gameSystem="PF2E"</code>`);
	unableSearchResults.append(`<code>sage! game update gameSystem="PF2E"</code>`);
	unableSearchResults.append(`<code>sage! server update gameSystem="PF2E"</code>`);
	unableSearchResults.append(`<br/>Acceptable gameSystem values are:<ul><li>"PF" (Pathfinder)</li><li>"PF2E" (Pathfinder 2e)</li><li>"SF" (Starfinder)</li></ul>`);
	unableSearchResults.append(`<br/>For more information, see <https://rpgsage.io>`);
	await sageMessage.sageCache.send(sageMessage.message.channel, unableSearchResults, sageMessage.message.author);
	return Promise.resolve();
}

async function currentlyDisabled(sageMessage: SageMessage): Promise<void> {
	const unableSearchResults = new RenderableContent(`<b>Cannot Perform Search</b>`);
	unableSearchResults.append(`We are sorry, we have disabled the search engine for this game system for the following reason:`);
	unableSearchResults.append(`<br/>${sageMessage.bot.getSearchStatus(sageMessage.gameSystemType)}`);
	unableSearchResults.append(`<br/>For more information, join us at <https://discord.com/invite/pfAcUMN>`);
	await sageMessage.sageCache.send(sageMessage.message.channel, unableSearchResults, sageMessage.message.author);
	return Promise.resolve();
}

export async function searchHandler(sageMessage: SageMessage, nameOnly = false): Promise<void> {
	if (!sageMessage.allowCommand) {
		return;
	}

	// make sure we have a game at AoN
	const searchEngine = getSearchEngine(sageMessage.gameSystemType);
	if (!searchEngine) {
		return invalidGame(sageMessage);
	}

	// make sure we haven't disabled the search for some reason
	const searchEnabled = sageMessage.bot.canSearch(sageMessage.gameSystemType);
	if (!searchEnabled) {
		return currentlyDisabled(sageMessage);
	}

	// Let em know we are busy ...
	const promise = sageMessage.sageCache.send(sageMessage.message.channel, `> Searching ${searchEngine.name}, please wait ...`, sageMessage.message.author);

	// Parse the query
	const parsedSearchInfo = parseSearchInfo(Collection.from(sageMessage.args.toArray()), RARITIES);

	// start the search
	const searchResults = await searchEngine.search(parsedSearchInfo, nameOnly);

	// decide what to render
	const renderableToSend = theOneOrMatchToSage(searchResults, nameOnly) ?? searchResults;

	// delete the "please wait" message(s)
	const messages = await promise;
	deleteMessages(messages);

	// Send the proper results
	await sageMessage.sageCache.send(sageMessage.message.channel, renderableToSend, sageMessage.message.author);

	return Promise.resolve();
}
