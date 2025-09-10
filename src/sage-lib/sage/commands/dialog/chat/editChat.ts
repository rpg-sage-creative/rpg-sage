import { error } from "@rsc-utils/core-utils";
import { splitMessageOptions, toMessageUrl, validateMessageOptions } from "@rsc-utils/discord-utils";
import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import { AttachmentBuilder } from "discord.js";
import { deleteMessage } from "../../../../discord/deletedMessages.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { includeDeleteButton } from "../../../model/utils/deleteButton.js";
import { DialogType } from "../../../repo/base/IdRepository.js";
import { DialogMessageRepository } from "../../../repo/DialogMessageRepository.js";
import type { DialogContent } from "../DialogContent.js";
import { updateEmbed } from "../updateEmbed.js";

export async function editChat(sageMessage: SageMessage, dialogContent: DialogContent): Promise<void> {
	const localize = sageMessage.getLocalizer();

	if (!sageMessage.message.reference) {
		return sageMessage.replyStack.whisper(localize("TO_EDIT_DIALOG"));
	}

	const dialogMessage = await DialogMessageRepository.read(sageMessage.message.reference);
	if (!dialogMessage) {
		return sageMessage.replyStack.whisper(localize("SORRY_DIALOG_NOT_FOUND"));
	}

	/** @todo allow GMs to edit other GM dialog, but send the edit info to both */
	if (dialogMessage.userId !== sageMessage.actorId) {
		return sageMessage.replyStack.whisper(localize("YOU_CANNOT_EDIT_ANOTHER"));
	}

	const message = await sageMessage.sageCache.fetchMessage(dialogMessage.toMessageReference());
	if (!message) {
		return sageMessage.replyStack.whisper(localize("SORRY_MESSAGE_NOT_FOUND"));
	}

	const guildId = sageMessage.server?.did;
	const channelId = sageMessage.threadOrChannelDid;
	if (!guildId || !channelId) {
		return sageMessage.replyStack.whisper(localize("CANNOT_FIND_WEBHOOK"));
	}

	const webhook = await sageMessage.discord.fetchWebhook({ guildId, channelId });
	if (!webhook) {
		return sageMessage.replyStack.whisper(localize("CANNOT_FIND_WEBHOOK"));
	}

	const embed = message.embeds[0];
	const originalContent = embed?.description ?? message.content;
	const updatedImageUrl = dialogContent.embedImageUrl;
	const updatedContent = sageMessage.sageCache.format(dialogContent.content);
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

		if (sageMessage.sageUser.dmOnEdit) {
			// because this is a SageMessage we already validated the actor
			const user = sageMessage.actor.discord;
			if (user) {
				const content = localize("YOU_EDITED_S_DIALOG", toMessageUrl(message)!);
				const files = [new AttachmentBuilder(Buffer.from(originalContent, "utf-8"), { name:`original-content.md` })];
				await user.send(includeDeleteButton({ content, files }, sageMessage.actorId));
			}
		}
	}

	/** @todo handle content/embed lengths that are too long and alert the user */
	if (payloads.length > 1 || !isValid) {
		await sageMessage.replyStack.whisper(localize("INVALID_DIALOG_EDIT"));
	}
}