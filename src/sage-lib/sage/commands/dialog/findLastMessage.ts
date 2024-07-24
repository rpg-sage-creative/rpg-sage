import { isNonNilSnowflake, type Optional } from "@rsc-utils/core-utils";
import { DiscordKey } from "@rsc-utils/discord-utils";
import type { TDialogMessage } from "../../model/GameCharacter";
import type { SageMessage } from "../../model/SageMessage";
import { DialogMessageRepository } from "../../repo/DialogMessageRepository";

export async function findLastMessage(sageMessage: SageMessage, messageId: Optional<string>): Promise<TDialogMessage | null> {
	if (isNonNilSnowflake(messageId)) {
		const messageKey = new DiscordKey(sageMessage.server?.did, null, null, messageId);
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