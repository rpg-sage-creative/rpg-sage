import { errorReturnEmptyArray } from "@rsc-utils/console-utils";
import type { DMessage } from "@rsc-utils/discord-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { MessageAttachment, WebhookMessageOptions } from "discord.js";
import { replaceWebhook, sendWebhook } from "../../../discord/messages.js";
import type { SageMessage } from "../../model/SageMessage.js";
import type { DialogType } from "../../repo/base/IdRepository.js";

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
export async function sendDialogRenderable({ authorOptions, dialogTypeOverride, files, renderableContent, sageMessage, skipDelete }: DialogRenderableOptions): Promise<DMessage[]> {
	const sageCache = sageMessage.caches;
	const dialogType = dialogTypeOverride ?? sageMessage.dialogPostType;

	const targetChannel = await sageMessage.discord.fetchChannel(sageMessage.channel?.sendDialogTo);
	if (targetChannel) {
		const sent = await sendWebhook(targetChannel, { sageCache, renderableContent, authorOptions, dialogType, files }).catch(errorReturnEmptyArray);
		return sent as DMessage[];
	}

	const replaced = await replaceWebhook(sageMessage.message, { sageCache, renderableContent, authorOptions, dialogType, files, skipDelete }).catch(errorReturnEmptyArray);
	return replaced as DMessage[];
}
