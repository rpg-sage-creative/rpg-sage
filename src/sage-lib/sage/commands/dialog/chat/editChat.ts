import { ZERO_WIDTH_SPACE } from "../../../../../sage-utils";
import { error } from "../../../../../sage-utils/utils/ConsoleUtils";
import { errorReturnNull } from "../../../../../sage-utils/utils/ConsoleUtils/Catchers";
import { DiscordKey } from "../../../../discord";
import { deleteMessage } from "../../../../discord/deletedMessages";
import { embedsToTexts } from "../../../../discord/embeds";
import { SageDialogWebhookName } from "../../../../discord/messages";
import type { TDialogMessage } from "../../../model/GameCharacter";
import type SageMessage from "../../../model/SageMessage";
import { DialogType } from "../../../repo/base/IdRepository";
import type { DialogContent } from "../DialogContent";
import { findLastMessage } from "../findLastMessage";
import { updateEmbed } from "../updateEmbed";

function dialogMessageToDiscordKey(dialogMessage: TDialogMessage): DiscordKey {
	return new DiscordKey(dialogMessage.serverDid, dialogMessage.channelDid, dialogMessage.threadDid, dialogMessage.messageDid);
}

export async function editChat(sageMessage: SageMessage, dialogContent: DialogContent): Promise<void> {
	const messageDid = dialogContent.name ?? sageMessage.message.reference?.messageId,
		dialogMessage = await findLastMessage(sageMessage, messageDid).catch(errorReturnNull),
		discordKey = dialogMessage ? dialogMessageToDiscordKey(dialogMessage) : null,
		message = discordKey ? await sageMessage.discord.fetchMessage(discordKey) : null;
	if (!message) {
		return sageMessage.reactWarn();
	}

	const embed = message.embeds[0],
		updatedImageUrl = dialogContent.imageUrl,
		updatedContent = sageMessage.caches.format(dialogContent.content),
		updatedEmbed = updateEmbed(embed, updatedImageUrl, updatedContent);
	const webhook = await sageMessage.discord.fetchWebhook(sageMessage.server.did, sageMessage.threadOrChannelDid, SageDialogWebhookName);
	if (webhook) {
		const threadId = sageMessage.threadDid;
		const postType = dialogContent.postType ?? (embed ? DialogType.Embed : DialogType.Post);
		const content = postType === DialogType.Post ? embedsToTexts([updatedEmbed]).join("\n") : ZERO_WIDTH_SPACE;
		const embeds = postType === DialogType.Embed ? [updatedEmbed] : [];
			await webhook.editMessage(message.id, { content, embeds, threadId }).then(() => deleteMessage(sageMessage.message), error);
	}else {
		return sageMessage.reactWarn();
	}
	return Promise.resolve();
}