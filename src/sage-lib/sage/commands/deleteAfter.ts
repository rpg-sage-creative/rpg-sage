import { toMessageUrl } from "@rsc-utils/discord-utils";
import type { MessageContextMenuCommandInteraction } from "discord.js";
import { deleteMessages } from "../../discord/deletedMessages.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../discord/prompts.js";
import type { SageInteraction } from "../model/SageInteraction.js";

export async function deleteAfter(sageInteraction: SageInteraction): Promise<void> {
	if (sageInteraction.isSuperUser) {
		sageInteraction.replyStack.deferAndDelete();
		const interaction = sageInteraction.interaction as MessageContextMenuCommandInteraction;
		const message = interaction.targetMessage;
		const confirm = await discordPromptYesNo(sageInteraction, `Delete All Messages After: ${toMessageUrl(message)}`);
		if (confirm) {
			const channel = message.channel;
			const messagesToDelete = await channel.messages.fetch({ after:message.id });
			if (!messagesToDelete.size) {
				return sageInteraction.replyStack.whisper("Nothing to delete.");
			}

			await sageInteraction.replyStack.startThinking();

			await deleteMessages(messagesToDelete);

			await sageInteraction.replyStack.stopThinking();
		}
	}
}

export function registerDeleteAfter(): void {
	registerListeners({ commands:["Delete After"], interaction:deleteAfter });
}