import { discordPromptYesNo } from "../../../../discord/prompts";
import type SageMessage from "../../../model/SageMessage";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";

async function prefixSet(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.reactBlock();
	}

	if (sageMessage.args?.length > 1) {
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

export default function register(): void {
	registerAdminCommand(prefixSet, "prefix-set");
	registerAdminCommandHelp("Admin", "Prefix", "prefix set {commandPrefix; ex: sage}");

	registerAdminCommand(prefixGet, "prefix-get");
	registerAdminCommandHelp("Admin", "Prefix", "prefix get");

	registerAdminCommand(prefixSync, "prefix-sync");
	registerAdminCommandHelp("Admin", "Prefix", "prefix sync");

	registerAdminCommand(prefixUnset, "prefix-unset");
	registerAdminCommandHelp("Admin", "Prefix", "prefix unset");
}
