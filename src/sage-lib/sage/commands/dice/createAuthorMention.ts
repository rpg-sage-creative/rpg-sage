import { toHumanReadable, toUserMention } from "@rsc-utils/discord-utils";
import type { SageCommand } from "../../model/SageCommand.js";

/**
 * This creates a Discord mention for the user rolling the dice.
 * @todo maybe consider a "posterId" that can be a message sender and interaction sender (to replace authorDid)
 */
export async function createAuthorMention(sageCommand: SageCommand, isSecretMention = false): Promise<string | undefined> {
	// actorId refers to the user posting the message; interactions don't have messages
	const actorId = sageCommand.sageUser.did;

	// make sure the user is part of the game
	const gameUser = sageCommand.game?.getUser(actorId);
	if (!gameUser) {
		return toUserMention(actorId);
	}

	// create a user mention
	let authorReference = toUserMention(gameUser.did);

	// if this is being posted in secret to GM /OR/ the player doesn't want pings, use a human-readable non-mention instead
	if (isSecretMention || gameUser.dicePing === false) {
		const user = await sageCommand.discord.fetchUser(actorId);
		authorReference = toHumanReadable(user);
	}

	// if the player is a PC, include the character's name to keep everybody on the same page
	const playerCharacter = sageCommand.playerCharacter;
	if (playerCharacter) {
		authorReference = authorReference
			? `${authorReference} (${playerCharacter.name})`
			: playerCharacter.name;
	}

	return authorReference;
}