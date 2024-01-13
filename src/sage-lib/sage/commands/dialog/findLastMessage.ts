import { Optional } from "@rsc-utils/type-utils";
import type { Snowflake } from "discord.js";
import { DiscordId, DiscordKey, NilSnowflake } from "../../../discord";
import type { TDialogMessage } from "../../model/GameCharacter";
import type SageMessage from "../../model/SageMessage";
import DialogMessageRepository from "../../repo/DialogMessageRepository";

export async function findLastMessage(sageMessage: SageMessage, messageDid: Optional<Snowflake>): Promise<TDialogMessage | null> {
	if (DiscordId.isValidId(messageDid) && messageDid !== NilSnowflake) {
		const messageKey = new DiscordKey(sageMessage.server?.did, null, null, messageDid);
		return DialogMessageRepository.read(messageKey);
	}

	const lastMessages: TDialogMessage[] = [];
	if (sageMessage.game) {
		if (sageMessage.isPlayer) {
			lastMessages.push(...(sageMessage.playerCharacter?.getLastMessages(sageMessage.discordKey) ?? []));
		} else if (sageMessage.isGameMaster) {
			lastMessages.push(...sageMessage.game.nonPlayerCharacters.getLastMessages(sageMessage.discordKey));
		}
	} else {
		lastMessages.push(...sageMessage.sageUser.playerCharacters.getLastMessages(sageMessage.discordKey));
		lastMessages.push(...sageMessage.sageUser.nonPlayerCharacters.getLastMessages(sageMessage.discordKey));
	}

	lastMessages.sort((a, b) => a.timestamp - b.timestamp);

	return lastMessages.pop() ?? null;
}