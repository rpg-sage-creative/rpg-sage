import { randomSnowflake, type Optional } from "@rsc-utils/core-utils";
import type { SageInteraction } from "../../model/SageInteraction.js";
import type { SageMessage } from "../../model/SageMessage.js";
import type { GameMap } from "./GameMap.js";
import { LayerType } from "./GameMapBase.js";

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

/** If the user is a player in a game, this will ensure their tokens (pc/companions) are on the map */
export function ensurePlayerCharacter(sageCommand: SageInteraction | SageMessage, gameMap: GameMap): boolean {
	if (sageCommand.isGameMaster) {
		return false;
	}
	const pc = sageCommand.playerCharacter;
	if (!pc) {
		return false;
	}
	let updated = false;
	[pc].concat(pc.companions).forEach(char => {
		const { tokenUrl, avatarUrl } = char;
		const charUrl = tokenUrl ?? avatarUrl;
		if (charUrl) {
			const charName = char.name;
			const found = gameMap.tokens.find(token => token.characterId === char.id)
				?? gameMap.tokens.find(token => !token.characterId && char.matches(token.name))
				?? gameMap.tokens.find(token => !token.characterId && urlsMatch(token.url, tokenUrl, avatarUrl));
			if (!found) {
				sageCommand.replyStack.editReply(`Adding token for ${charName} ...`, true);
				gameMap.tokens.push({
					auras: [],
					characterId: char.id,
					id: randomSnowflake(),
					layer: LayerType.Token,
					name: charName,
					pos: gameMap.spawn ?? [1,1],
					size: [1,1],
					url: charUrl,
					userId: sageCommand.sageUser.did
				});
				updated = true;
			}else {
				// if (found.name !== charName || found.url !== charUrl) {
				// 	sageCommand.replyStack.editReply(`Updating token for ${charName} ...`, true);
				// 	found.name = charName;
				// 	found.url = charUrl;
				// 	updated = true;
				// }

				// ensure character and token are linked by id
				if (found.characterId !== char.id) {
					found.characterId = char.id;
					updated = true;
				}
			}
		}
	});
	return updated;
}
