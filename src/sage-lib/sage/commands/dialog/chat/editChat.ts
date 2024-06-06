import { error, errorReturnNull } from "@rsc-utils/core-utils";
import { DiscordKey, DMessage, splitMessageOptions, toMessageUrl, validateMessageOptions } from "@rsc-utils/discord-utils";
import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import { MessageAttachment } from "discord.js";
import { deleteMessage } from "../../../../discord/deletedMessages.js";
import type { TDialogMessage } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { addMessageDeleteButton } from "../../../model/utils/deleteButton.js";
import { DialogType } from "../../../repo/base/IdRepository.js";
import type { DialogContent } from "../DialogContent.js";
import { findLastMessage } from "../findLastMessage.js";
import { updateEmbed } from "../updateEmbed.js";

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

	const webhook = await sageMessage.discord.fetchWebhook(sageMessage.server.did, sageMessage.threadOrChannelDid, "dialog");
	if (webhook) {
		const embed = message.embeds[0];
		const originalContent = embed?.description ?? message.content;
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

			const user = await sageMessage.discord.fetchUser(sageMessage.authorDid);
			if (user) {
				const content = `You edited: ${toMessageUrl(message as DMessage)}\nThe original content has been attached to this message.`;
				const files = [new MessageAttachment(Buffer.from(originalContent, "utf-8"), `original-content.md`)];
				const sent = await user.send({ content, files });
				await addMessageDeleteButton(sent as DMessage, user.id);
			}

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