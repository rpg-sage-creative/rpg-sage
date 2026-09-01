import type { RenderableContent } from "@rsc-utils/core-utils";
import { toUserMention } from "@rsc-utils/discord-utils";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createMacroComponents } from "./createMacroComponents.js";
import { getArgs, type Args } from "./getArgs.js";
import { macroToPrompt } from "./macroToPrompt.js";

async function toRenderableContent(sageCommand: SageCommand, { macro }: Args): Promise<RenderableContent> {
	const localize = sageCommand.getLocalizer();

	const renderableContent = sageCommand.createAdminRenderable("MACRO_DETAILS");

	if (macro) {
		renderableContent.append(await macroToPrompt(sageCommand, macro, { share:true, usage:true }));
	} else {
		renderableContent.append(localize("MACRO_S_NOT_FOUND", sageCommand.args.getString("name")));
	}

	return renderableContent;
}

/** args is true when coming in the first time from post/slash ... */
export async function mCmdDetails(sageCommand: SageCommand, args?: Args | boolean, noComponents?: boolean): Promise<void> {
	sageCommand.replyStack.defer();

	const localize = sageCommand.getLocalizer();

	if (!sageCommand.allowCommand && !sageCommand.allowDice) {
		return sageCommand.replyStack.whisper(localize("CANNOT_MANAGE_MACRO_HERE"));
	}

	if (!args || args === true) {
		args = await getArgs(sageCommand);
	}

	const content = toUserMention(sageCommand.actorId);
	const embeds = await toRenderableContent(sageCommand, args);
	const components = noComponents ? [] : await createMacroComponents(sageCommand, args);

	const message = await sageCommand.fetchMessage(args.customIdArgs?.messageId).catch(() => undefined);
	if (message && message?.author.id !== sageCommand.actorId) {
		await message.edit(sageCommand.resolveToOptions({ content, embeds, components }));
	}else {
		await sageCommand.replyStack.send({ content, embeds, components });
	}

}
