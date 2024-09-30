import type { MessageContextMenuCommandInteraction } from "discord.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { SageInteraction } from "../model/SageInteraction.js";
import { discordPromptYesNo } from "../../discord/prompts.js";
import { toMessageUrl } from "@rsc-utils/discord-utils";
import { deleteMessages } from "../../discord/deletedMessages.js";

export async function deleteAfter(sageInteraction: SageInteraction): Promise<void> {
	if (sageInteraction.isSuperUser) {
		sageInteraction.replyStack.deferAndDelete();
		const interaction = sageInteraction.interaction as MessageContextMenuCommandInteraction;
		const message = interaction.targetMessage;
		const confirm = await discordPromptYesNo(sageInteraction, `Delete All Messages After: ${toMessageUrl(message)}`);
		if (confirm) {
			const channel = message.channel;
			const messagesToDelete = await channel.messages.fetch({ after:message.id });
			await sageInteraction.replyStack.startThinking();
			if ("bulkDelete" in channel) {
				await channel.bulkDelete(messagesToDelete);
			}else {
				await deleteMessages([...messagesToDelete.values()]);
			}
			await sageInteraction.replyStack.stopThinking();
		}
	}
}

export function registerDeleteAfter(): void {
	registerListeners({ commands:["Delete After"], interaction:deleteAfter });
}