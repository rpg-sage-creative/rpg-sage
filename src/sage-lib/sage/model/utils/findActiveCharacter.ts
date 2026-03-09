import { debug, type Snowflake } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../GameCharacter.js";
import type { SageCommand } from "../SageCommand.js";

/**
 * Active characters in Game channels are found as follows:
 * - first auto Game PC that matches channel/user
 * - first auto Game NPC that matches channel/user
 * - (Player) first Game PC
 * - (Player) first Game NPC
 * - (GM) gm character
 * - first auto User PC that matches channel/user
 * - first auto User NPC that matches channel/user
 *
 * Active characters in non-Game channels are found as follows:
 * - first auto User PC that matches channel/user
 * - first auto User NPC that matches channel/user
 *
 * @param sageCommand
 * @param characterId
 * @returns
 */
export function findActiveCharacter(sageCommand: SageCommand, characterId?: Snowflake): GameCharacter | undefined {
	debug({fn:"findActiveCharacter",characterId});
	const { actor, channel } = sageCommand;
	if (!actor.id || !channel?.type) return undefined;

	const { game, server } = sageCommand;
	const { sage } = actor;

	let character: GameCharacter | undefined;

	// no id is given so try to figure out who the active char should be
	if (!characterId) {
		const { id:userId, isGamePlayer, isGameMaster } = actor;
		const autoChannelData = { channelId:channel.id, userId:userId! };

		// try game auto characters
		if (game) {
			character ??= game.playerCharacters.getAutoCharacter(autoChannelData)?.char
				?? game.nonPlayerCharacters.getAutoCharacter(autoChannelData)?.char;

			// try user's primary pc/npc
			if (isGamePlayer) {
				character ??= game.playerCharacters.findByUser(userId)
					?? game.nonPlayerCharacters.findByUser(userId);
			}

			if (isGameMaster) {
				character ??= game.gmCharacter;
			}
		}

		// try user auto characters (this accounts for bugs that let auto characters from outside the game)
		character ??= sage.playerCharacters.getAutoCharacter(autoChannelData)?.char
			?? sage.nonPlayerCharacters.getAutoCharacter(autoChannelData)?.char;

	// we have the id, so look everywhere for the char
	}else {

		character ??= game?.playerCharacters.findById(characterId)
			?? game?.nonPlayerCharacters.findById(characterId)
			?? sage.playerCharacters.findById(characterId)
			?? sage.nonPlayerCharacters.findById(characterId)
			?? (game?.gmCharacter.id === characterId ? game.gmCharacter : undefined)
			?? game?.gmCharacter.companions.findById(characterId)
			?? (server?.gmCharacter.id === characterId ? server.gmCharacter : undefined)
			?? server?.gmCharacter.companions.findById(characterId);

	}

	return character;
}