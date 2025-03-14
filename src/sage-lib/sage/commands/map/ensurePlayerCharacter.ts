import { isDefined, randomSnowflake, type Optional } from "@rsc-utils/core-utils";
import type { SageInteraction } from "../../model/SageInteraction.js";
import type { SageMessage } from "../../model/SageMessage.js";
import type { GameMap } from "./GameMap.js";
import { LayerType, type TGameMapToken } from "./GameMapBase.js";

/**
 * Assists in comparing discord attachment image urls.
 * Removes querystring from links grabbed from the web (usually width/height).
 * Changes media.discordapp.net to cdn.discordapp.com.
 */
function simplifyDiscordAttachmentUrl(url: string): string {
	// app https://cdn.discordapp.com/attachments/1140421024777781340/1141450682545745930/opal.png
	// web https://media.discordapp.net/attachments/1140421024777781340/1141450682545745930/opal.png?width=211&height=211
	const appPrefix = "https://cdn.discordapp.com";
	const webPrefix = "https://media.discordapp.net";
	if (url.startsWith(webPrefix)) {
		const endIndex = url.includes("?") ? url.indexOf("?") : undefined;
		return appPrefix + url.slice(webPrefix.length, endIndex);
	}
	return url;
}

/** Compares urls only after simplifying them (if they are discord attachment urls from the web). */
function urlsMatch(tokenUrl: string, ...otherUrls: Optional<string>[]): boolean {
	if (tokenUrl) {
		const simpleTokenUrl = simplifyDiscordAttachmentUrl(tokenUrl);
		return otherUrls.some(otherUrl => otherUrl && simpleTokenUrl === simplifyDiscordAttachmentUrl(otherUrl));
	}
	return false;
}

type Results = {
	/** names of characters added to map */
	added: string[];
	/** names of characters whose tokens got linked to game characters */
	linked: string[];
	/** total number of tokens adding/updated */
	total: number;
}

/** If the user is a player in a game, this will ensure their tokens (pc/companions) are on the map */
export function ensurePlayerCharacter(sageCommand: SageInteraction | SageMessage, gameMap: GameMap): Results {
	const results = { added:[], linked:[], total:0 } as Results;

	const userId = sageCommand.sageUser.did;

	// filter all game users by user ... if no game, use .playerCharacter to grab auto channel character for out of a game channel
	const pcs = sageCommand.game?.playerCharacters.filterByUser(userId)
		?? [sageCommand.playerCharacter].filter(isDefined);

	// if no pcs then we don't need to ensure anything
	if (!pcs.length) {
		return results;
	}

	let linkedTokens = 0;
	const tokensToAdd: TGameMapToken[] = [];

	// iterate each pc
	pcs.forEach(pc => {
		// we really wanna iterate pcs *and* companions
		[pc].concat(pc.companions).forEach(char => {
			// grab images
			const { tokenUrl, avatarUrl } = char;
			// grab primary image
			const charUrl = tokenUrl ?? avatarUrl;
			// we only ensure chars with images
			if (charUrl) {
				const charName = char.name;
				// look for char by id before looking for tokens without ids that match the name before looking for tokens without ids that match the urls
				const found = gameMap.tokens.find(token => token.characterId === char.id)
					?? gameMap.tokens.find(token => !token.characterId && char.matches(token.name))
					?? gameMap.tokens.find(token => !token.characterId && urlsMatch(token.url, tokenUrl, avatarUrl));
				// if we don't find the char push the token we *want* to add (but we will add later only if we don't find tokens for this user)
				if (!found) {
					tokensToAdd.push({
						auras: [],
						characterId: char.id,
						id: randomSnowflake(),
						layer: LayerType.Token,
						name: charName,
						pos: gameMap.spawn ?? [1,1],
						size: [1,1],
						url: charUrl,
						userId
					});
				}else {
					// save that we found a token
					linkedTokens++;
					// ensure character and token are linked by id
					if (found.characterId !== char.id) {
						found.characterId = char.id;
						results.linked.push(charName);
					}
				}
			}
		});
	});

	// assuming the gm made the map correctly, we would only add pcs/companions if the gm didn't add any for this user
	if (!linkedTokens) {
		gameMap.tokens.push(...tokensToAdd);
		results.added.push(...tokensToAdd.map(token => token.name));
	}

	results.total = results.added.length + results.linked.length;
	return results;
}
