import { errorReturnEmptyArray } from "@rsc-utils/console-utils";
import type { Message, MessageAttachment, WebhookMessageOptions } from "discord.js";
import type { RenderableContent } from "../../../../sage-utils/utils/RenderUtils";
import { replaceWebhook, sendWebhook } from "../../../discord/messages";
import type { SageMessage } from "../../model/SageMessage";
import type { DialogType } from "../../repo/base/IdRepository";

type DialogRenderableOptions = {
	authorOptions: WebhookMessageOptions;
	dialogTypeOverride?: DialogType;
	files?: MessageAttachment[];
	renderableContent: RenderableContent;
	sageMessage: SageMessage;
	skipDelete?: boolean;
};

/**
 * @todo sort out why i am casting caches to <any>
 */
export async function sendDialogRenderable({ authorOptions, dialogTypeOverride, files, renderableContent, sageMessage, skipDelete }: DialogRenderableOptions): Promise<Message[]> {
	const sageCache = sageMessage.caches;
	const dialogType = dialogTypeOverride ?? sageMessage.dialogType;

	const targetChannel = await sageMessage.discord.fetchChannel(sageMessage.channel?.sendDialogTo);
	if (targetChannel) {
		const sent = await sendWebhook(targetChannel, { sageCache, renderableContent, authorOptions, dialogType, files }).catch(errorReturnEmptyArray);
		return sent;
	}

	const replaced = await replaceWebhook(sageMessage.message, { sageCache, renderableContent, authorOptions, dialogType, files, skipDelete }).catch(errorReturnEmptyArray);
	return replaced;
}
