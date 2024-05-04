import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { createAdminRenderableContent } from "../../cmd.js";

async function prefixSet(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.reactBlock();
	}

	if (sageMessage.args?.toArray().length > 1) {
		return sageMessage.reactFailure();
	}

	const saved = await sageMessage.server.setCommandPrefix(sageMessage.args.shift()!);
	return sageMessage.reactSuccessOrFailure(saved);
}

async function prefixGet(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.reactBlock();
	}

	const renderableContent = createAdminRenderableContent(sageMessage.server, "<b>Server Command Prefix</b>");
	const commandPrefix =
		(sageMessage.server.commandPrefix ?? `<i>inherited (${sageMessage.bot.commandPrefix})</i>`)
		|| `<i>unset (no prefix)</i>`;

	renderableContent.append(commandPrefix);
	return <any>sageMessage.send(renderableContent);
}

async function prefixSync(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.reactBlock();
	}

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync command prefix with Sage?");
	if (booleanResponse) {
		const saved = await sageMessage.server.syncCommandPrefix();
		sageMessage.reactSuccessOrFailure(saved);
	}
	return Promise.resolve();
}

async function prefixUnset(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.reactBlock();
	}

	const saved = await sageMessage.server.unsetCommandPrefix();
	return sageMessage.reactSuccessOrFailure(saved);
}

export function registerPrefix(): void {
	registerListeners({ commands:["prefix|set"], message:prefixSet });
	registerListeners({ commands:["prefix|get"], message:prefixGet });
	registerListeners({ commands:["prefix|sync"], message:prefixSync });
	registerListeners({ commands:["prefix|unset"], message:prefixUnset });
}
