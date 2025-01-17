import type { RenderableContent } from "@rsc-utils/render-utils";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createMacroComponents } from "./createMacroComponents.js";
import { getArgs, type Args } from "./getArgs.js";
import { macroToPrompt } from "./macroToPrompt.js";

function toRenderableContent(sageCommand: SageCommand, { macro }: Args): RenderableContent {
	const localize = sageCommand.getLocalizer();

	const renderableContent = sageCommand.createAdminRenderable("MACRO_DETAILS");

	if (macro) {
		renderableContent.append(macroToPrompt(sageCommand, macro, { share:true, usage:true }));
	} else {
		renderableContent.append(localize("MACRO_S_NOT_FOUND", sageCommand.args.getString("name")));
	}

	return renderableContent;
}

/** args is true when coming in the first time from post/slash ... */
export async function mCmdDetails(sageCommand: SageCommand, args?: Args | boolean): Promise<void> {
	sageCommand.replyStack.defer();

	const localize = sageCommand.getLocalizer();

	if (!sageCommand.allowCommand && !sageCommand.allowDice) {
		return sageCommand.replyStack.whisper(localize("CANNOT_MANAGE_MACRO_HERE"));
	}

	if (!args || args === true) {
		args = await getArgs(sageCommand);
	}

	const content = toRenderableContent(sageCommand, args);
	const components = createMacroComponents(sageCommand, args);

	const message = await sageCommand.fetchMessage(args.customIdArgs?.messageId).catch(() => undefined);
	if (message) {
		await message.edit(sageCommand.resolveToOptions({ embeds:content, components }));
	}else {
		await sageCommand.replyStack.send({ embeds:content, components });
	}

}
