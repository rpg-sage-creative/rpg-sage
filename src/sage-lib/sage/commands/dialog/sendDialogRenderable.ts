import { getLocalizedText } from "@rsc-sage/localization";
import { errorReturnEmptyArray, type RenderableContent } from "@rsc-utils/core-utils";
import { isInvalidWebhookUsername, type SupportedMessagesChannel } from "@rsc-utils/discord-utils";
import type { Message } from "discord.js";
import { replaceWebhook, sendWebhook, type AuthorOptions } from "../../../discord/messages.js";
import type { AttachmentResolvable } from "../../../discord/sendTo.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { includeDeleteButton } from "../../model/utils/deleteButton.js";
import type { DialogType } from "../../repo/base/IdRepository.js";

type DialogRenderableOptions = {
	authorOptions: AuthorOptions;
	dialogTypeOverride?: DialogType;
	files?: AttachmentResolvable[];
	renderableContent: RenderableContent;
	sageMessage: SageMessage;
	skipDelete?: boolean;
};

/**
 * @todo sort out why i am casting caches to <any>
 */
export async function sendDialogRenderable({ authorOptions, dialogTypeOverride, files, renderableContent, sageMessage, skipDelete }: DialogRenderableOptions): Promise<Message[]> {
	if (authorOptions.username) {
		const invalidName = isInvalidWebhookUsername(authorOptions.username);
		if (invalidName) {
			const content = invalidName === true
				? getLocalizedText("USERNAME_TOO_LONG", "en-US")
				: getLocalizedText("USERNAME_S_BANNED", "en-US", invalidName)
			await sageMessage.message.reply(includeDeleteButton({ content }, sageMessage.actorId));
			return [];
		}
	}

	const { sageCache } = sageMessage;
	const dialogType = dialogTypeOverride ?? sageMessage.dialogPostType;

	const targetChannel = await sageCache.fetchChannel(sageMessage.channel?.sendDialogTo);
	if (targetChannel) {
		const sent = await sendWebhook(targetChannel as SupportedMessagesChannel, { sageCache, renderableContent, authorOptions, dialogType, files }).catch(errorReturnEmptyArray);
		return sent?.filter(msg => msg) ?? [];
	}

	const replaced = await replaceWebhook(sageMessage.message, { sageCache, renderableContent, authorOptions, dialogType, files, skipDelete }).catch(errorReturnEmptyArray);
	return replaced.filter(msg => msg);
}
