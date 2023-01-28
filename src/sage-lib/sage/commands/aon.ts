import { GameType } from "../../../sage-common";
import { Base, RARITIES } from "../../../sage-pf2e";
import type SearchResults from "../../../sage-search/SearchResults";
import { parseSearchInfo } from "../../../sage-search/common";
import { searchAonPf1e } from "../../../sage-search/pf1e";
import { searchAonPf2e } from "../../../sage-search/pf2e";
import { searchAonSf1e } from "../../../sage-search/sf1e";
import { Collection } from "../../../sage-utils/utils/ArrayUtils";
import { RenderableContent } from "../../../sage-utils/utils/RenderUtils";
import type { TChannel } from "../../discord";
import { send } from "../../discord/messages";
import type SageMessage from "../model/SageMessage";

function theOneOrMatchToSage(searchResults: SearchResults<Base>, match = false): Base | null {
	const aon = searchResults.theOne ?? (match ? searchResults.theMatch : null);
	if (aon) {
		const searchables = searchResults.searchables,
			index = searchables.indexOf(aon),
			sage = searchResults.sageSearchables[index];
		return sage ?? null;
	}
	return null;
}

export async function aonHandlerSf1e(sageMessage: SageMessage, nameOnly: boolean): Promise<void> {
	// Let em know we are busy ...
	const promise = send(sageMessage.caches, sageMessage.message.channel as TChannel, `> Searching Archives of Nethys, please wait ...`, sageMessage.message.author);

	// Parse the query
	const parsedSearchInfo = parseSearchInfo(Collection.from(sageMessage.args), RARITIES);

	// start the search
	const searchResults = await searchAonSf1e(parsedSearchInfo, nameOnly);

	// decide what to render (theOneOrMatchToSage is only valid for PF2 data; currently)
	const renderableToSend = searchResults;

	// delete the "please wait" message(s)
	const messages = await promise;
	messages.forEach(message => message.deletable ? message.delete() : void 0);

	// Send the proper results
	await send(sageMessage.caches, sageMessage.message.channel as TChannel, renderableToSend, sageMessage.message.author);
}

export async function aonHandlerPf1e(sageMessage: SageMessage, nameOnly: boolean): Promise<void> {
	// Let em know we are busy ...
	const promise = send(sageMessage.caches, sageMessage.message.channel as TChannel, `> Searching Archives of Nethys, please wait ...`, sageMessage.message.author);

	// Parse the query
	const parsedSearchInfo = parseSearchInfo(Collection.from(sageMessage.args), RARITIES);

	// start the search
	const searchResults = await searchAonPf1e(parsedSearchInfo, nameOnly);

	// decide what to render (theOneOrMatchToSage is only valid for PF2 data; currently)
	const renderableToSend = searchResults;

	// delete the "please wait" message(s)
	const messages = await promise;
	messages.forEach(message => message.deletable ? message.delete() : void 0);

	// Send the proper results
	await send(sageMessage.caches, sageMessage.message.channel as TChannel, renderableToSend, sageMessage.message.author);
}

export async function aonHandlerPf2e(sageMessage: SageMessage, nameOnly: boolean): Promise<void> {
	// Let em know we are busy ...
	const promise = send(sageMessage.caches, sageMessage.message.channel as TChannel, `> Searching Archives of Nethys, please wait ...`, sageMessage.message.author);

	// Parse the query
	const parsedSearchInfo = parseSearchInfo(Collection.from(sageMessage.args), RARITIES);

	// start the search
	const searchResults = await searchAonPf2e(parsedSearchInfo, nameOnly);

	// decide what to render
	const renderableToSend = theOneOrMatchToSage(searchResults, nameOnly) ?? searchResults;

	// delete the "please wait" message(s)
	const messages = await promise;
	messages.forEach(message => message.deletable ? message.delete() : void 0);

	// Send the proper results
	await send(sageMessage.caches, sageMessage.message.channel as TChannel, renderableToSend, sageMessage.message.author);
}

export async function aonHandler(sageMessage: SageMessage, nameOnly = false): Promise<void> {
	if (!sageMessage.allowSearch) {
		return sageMessage.reactBlock();
	}

	// make sure we have a game at AoN
	const gameType = sageMessage.gameType;
	if (gameType === GameType.PF1e) {
		return aonHandlerPf1e(sageMessage, nameOnly);
	}else if (gameType === GameType.PF2e) {
		return aonHandlerPf2e(sageMessage, nameOnly);
	}else if (gameType === GameType.SF1e) {
		return aonHandlerSf1e(sageMessage, nameOnly);
	}

	const unableSearchResults = new RenderableContent(`<b>Cannot Perform Search</b>`);
	unableSearchResults.append(`Currently, we can only search Pathfinder or Starfinder content. Please set your channel, game, or server to Pathfinder or Starfinder if you would like to enable searching for content.`);
	unableSearchResults.append(`For more information, see <https://rpgsage.io>`);
	unableSearchResults.append(`<br/>Example:`);
	unableSearchResults.append(`<code>sage!!channel set gameType="PF2E"</code>`);
	unableSearchResults.append(`<code>sage!!game set gameType="PF2E"</code>`);
	unableSearchResults.append(`<code>sage!!server set gameType="PF2E"</code>`);
	unableSearchResults.append(`<br/>Acceptable gameType values are:<ul><li>"PF" (Pathfinder)</li><li>"PF2E" (Pathfinder 2e)</li><li>"SF" (Starfinder)</li></ul>`);
	await send(sageMessage.caches, sageMessage.message.channel as TChannel, unableSearchResults, sageMessage.message.author);

	return Promise.resolve();
}
