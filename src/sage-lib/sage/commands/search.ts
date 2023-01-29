import { Base, RARITIES } from "../../../sage-pf2e";
import type SearchResults from "../../../sage-search/SearchResults";
import { TParsedSearchInfo, parseSearchInfo } from "../../../sage-search/common";
import { searchAonPf1e } from "../../../sage-search/pf1e";
import { searchAonPf2e } from "../../../sage-search/pf2e";
import { searchAonSf1e } from "../../../sage-search/sf1e";
import { Collection } from "../../../sage-utils/utils/ArrayUtils";
import { RenderableContent } from "../../../sage-utils/utils/RenderUtils";
import type { TChannel } from "../../discord";
import { send } from "../../discord/messages";
import type SageMessage from "../model/SageMessage";

enum AonGameType {
	PF1e = 11, //GameType.PF1e,
	PF2e = 12, //GameType.PF2e,
	SF1e = 21, //GameType.SF1e
};

function searchAon(gameType: AonGameType, parsedSearchInfo: TParsedSearchInfo, nameOnly: boolean): Promise<SearchResults> {
	switch(gameType) {
		case AonGameType.PF1e:
			return searchAonPf1e(parsedSearchInfo, nameOnly);
		case AonGameType.PF2e:
			return searchAonPf2e(parsedSearchInfo, nameOnly);
		case AonGameType.SF1e:
			return searchAonSf1e(parsedSearchInfo, nameOnly);
	}
}

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
	await send(sageMessage.caches, sageMessage.message.channel as TChannel, unableSearchResults, sageMessage.message.author);
	return Promise.resolve();
}

export async function searchHandler(sageMessage: SageMessage, nameOnly = false): Promise<void> {
	if (!sageMessage.allowSearch) {
		return;
	}

	// make sure we have a game at AoN
	const gameType = sageMessage.gameType as number as AonGameType;
	if (!AonGameType[gameType]) {
		return invalidGame(sageMessage);
	}

	// Let em know we are busy ...
	const promise = send(sageMessage.caches, sageMessage.message.channel as TChannel, `> Searching Archives of Nethys, please wait ...`, sageMessage.message.author);

	// Parse the query
	const parsedSearchInfo = parseSearchInfo(Collection.from(sageMessage.args), RARITIES);

	// start the search
	const searchResults = await searchAon(gameType, parsedSearchInfo, nameOnly);

	// decide what to render
	const renderableToSend = theOneOrMatchToSage(searchResults, nameOnly) ?? searchResults;

	// delete the "please wait" message(s)
	const messages = await promise;
	messages.forEach(message => message.deletable ? message.delete() : void 0);

	// Send the proper results
	await send(sageMessage.caches, sageMessage.message.channel as TChannel, renderableToSend, sageMessage.message.author);

	return Promise.resolve();
}
