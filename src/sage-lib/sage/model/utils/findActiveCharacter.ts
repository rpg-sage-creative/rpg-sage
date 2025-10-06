import { debug, type Snowflake } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../GameCharacter.js";
import type { SageCommand } from "../SageCommand.js";

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
		const autoChannelData = { channelDid:channel.id, userDid:userId! };

		// try game auto characters
		if (game) {
			character ??= game.playerCharacters.getAutoCharacter(autoChannelData)
				?? game.nonPlayerCharacters.getAutoCharacter(autoChannelData);

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
		character ??= sage.playerCharacters.getAutoCharacter(autoChannelData)
			?? sage.nonPlayerCharacters.getAutoCharacter(autoChannelData);

	}else if (characterId) {

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