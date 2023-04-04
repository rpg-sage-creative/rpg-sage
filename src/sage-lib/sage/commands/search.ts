import { RARITIES } from "../../../sage-pf2e";
import type { Base } from "../../../sage-pf2e/model/base/Base";
import type { SearchResults } from "../../../sage-search/SearchResults";
import { getSearchEngine, parseSearchInfo } from "../../../sage-search/common";
import { Collection } from "../../../sage-utils/ArrayUtils";
import { RenderableContent } from "../../../sage-utils/RenderUtils";
import { send } from "../../discord/messages";
import type { SageMessage } from "../model/SageMessage";

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
	unableSearchResults.append(`Currently, we can only search Pathfinder or Starfinder content. Please set your channel, game, or server to Pathfinder or Starfinder if you would like to enable searching for content, or disable searching if you don't wish to see this message again.`);
	unableSearchResults.append(`<br/>Example:`);
	unableSearchResults.append(`<code>sage!!channel set search="false"</code>`);
	unableSearchResults.append(`<code>sage!!channel set gameType="PF2E"</code>`);
	unableSearchResults.append(`<code>sage!!game set gameType="PF2E"</code>`);
	unableSearchResults.append(`<code>sage!!server set gameType="PF2E"</code>`);
	unableSearchResults.append(`<br/>Acceptable gameType values are:<ul><li>"PF" (Pathfinder)</li><li>"PF2E" (Pathfinder 2e)</li><li>"SF" (Starfinder)</li></ul>`);
	unableSearchResults.append(`<br/>For more information, see <https://rpgsage.io>`);
	await send(sageMessage.sageCache, sageMessage.message.channel, unableSearchResults, sageMessage.message.author);
	return Promise.resolve();
}

async function currentlyDisabled(sageMessage: SageMessage): Promise<void> {
	const unableSearchResults = new RenderableContent(`<b>Cannot Perform Search</b>`);
	unableSearchResults.append(`We are sorry, we have disabled the search engine for this game system for the following reason:`);
	unableSearchResults.append(`<br/>${sageMessage.bot.getSearchStatus(sageMessage.gameType)}`);
	unableSearchResults.append(`<br/>For more information, join us at <https://discord.com/invite/pfAcUMN>`);
	await send(sageMessage.sageCache, sageMessage.message.channel, unableSearchResults, sageMessage.message.author);
	return Promise.resolve();
}

export async function searchHandler(sageMessage: SageMessage, nameOnly = false): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Game Content Search");
	if (denial) {
		return denial;
	}

	// make sure we have a game at AoN
	const searchEngine = getSearchEngine(sageMessage.gameType);
	if (!searchEngine) {
		return invalidGame(sageMessage);
	}

	// make sure we haven't disabled the search for some reason
	const searchEnabled = sageMessage.bot.canSearch(sageMessage.gameType);
	if (!searchEnabled) {
		return currentlyDisabled(sageMessage);
	}

	// Let em know we are busy ...
	const promise = send(sageMessage.sageCache, sageMessage.message.channel, `> Searching ${searchEngine.name}, please wait ...`, sageMessage.message.author);

	// Parse the query
	const parsedSearchInfo = parseSearchInfo(Collection.from(sageMessage.args.unkeyedValues()), RARITIES);

	// start the search
	const searchResults = await searchEngine.search(parsedSearchInfo, nameOnly);

	// decide what to render
	const renderableToSend = theOneOrMatchToSage(searchResults, nameOnly) ?? searchResults;

	// delete the "please wait" message(s)
	const messages = await promise;
	messages.forEach(message => message.deletable ? message.delete() : void 0);

	// Send the proper results
	await send(sageMessage.sageCache, sageMessage.message.channel, renderableToSend, sageMessage.message.author);

	return Promise.resolve();
}
