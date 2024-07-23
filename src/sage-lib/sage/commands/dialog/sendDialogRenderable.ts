import { errorReturnEmptyArray } from "@rsc-utils/core-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { Message } from "discord.js";
import { replaceWebhook, sendWebhook, type AuthorOptions } from "../../../discord/messages.js";
import type { AttachmentResolvable } from "../../../discord/sendTo.js";
import type { SageMessage } from "../../model/SageMessage.js";
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
	if (/discord/i.test(authorOptions.username ?? "")) {
		await sageMessage.message.reply({ content:`Due to Discord policy, you cannot have a username with "discord" in the name!` });
		return [];
	}

	const sageCache = sageMessage.caches;
	const dialogType = dialogTypeOverride ?? sageMessage.dialogPostType;

	const targetChannel = await sageMessage.sageCache.fetchChannel(sageMessage.channel?.sendDialogTo);
	if (targetChannel) {
		const sent = await sendWebhook(targetChannel, { sageCache, renderableContent, authorOptions, dialogType, files }).catch(errorReturnEmptyArray);
		return sent?.filter(msg => msg) ?? [];
	}

	const replaced = await replaceWebhook(sageMessage.message, { sageCache, renderableContent, authorOptions, dialogType, files, skipDelete }).catch(errorReturnEmptyArray);
	return replaced.filter(msg => msg);
}
