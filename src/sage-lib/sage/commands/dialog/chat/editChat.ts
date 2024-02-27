import { error, errorReturnNull } from "@rsc-utils/console-utils";
import { DiscordKey, splitMessageOptions, validateMessageOptions } from "@rsc-utils/discord-utils";
import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import { deleteMessage } from "../../../../discord/deletedMessages";
import { SageDialogWebhookName } from "../../../../discord/messages";
import type { TDialogMessage } from "../../../model/GameCharacter";
import type { SageMessage } from "../../../model/SageMessage";
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

	const webhook = await sageMessage.discord.fetchWebhook(sageMessage.server.did, sageMessage.threadOrChannelDid, SageDialogWebhookName);
	if (webhook) {
		const embed = message.embeds[0];
		const updatedImageUrl = dialogContent.imageUrl;
		const updatedContent = sageMessage.caches.format(dialogContent.content);
		const updatedEmbed = updateEmbed(embed, updatedImageUrl, updatedContent);
		const threadId = sageMessage.threadDid;
		const msgOptions = { embeds:[updatedEmbed], threadId };

		const postType = dialogContent.postType ?? (embed ? DialogType.Embed : DialogType.Post);
		const splitOptions = {
			blankContentValue: ZERO_WIDTH_SPACE,
			contentToEmbeds: postType === DialogType.Embed,
			embedsToContent: postType === DialogType.Post
		};

		const payloads = splitMessageOptions(msgOptions, splitOptions);
		const isValid = validateMessageOptions(payloads[0]);
		if (isValid) {
			await webhook.editMessage(message.id, payloads[0]).then(() => deleteMessage(sageMessage.message), error);
		}

		/** @todo handle content/embed lengths that are too long and alert the user */
		if (payloads.length > 1 || !isValid) {
			sageMessage.reactWarn("The content you were trying to post was invalid in some way, likely too long.");
		}
	}else {
		return sageMessage.reactWarn("Unable to find webhook; Sage may not have access to post in this channel/thread.");
	}
	return Promise.resolve();
}