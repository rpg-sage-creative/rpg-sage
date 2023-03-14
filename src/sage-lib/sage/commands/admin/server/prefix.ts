import { discordPromptYesNo } from "../../../../discord/prompts";
import type SageMessage from "../../../model/SageMessage";
import { registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";

async function prefixSet(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyAdminServer("Set Sage Prefix");
	if (denial) {
		return denial;
	}

	const prefix = sageMessage.args.getString("prefix");
	if (prefix === null) {
		return prefixUnset(sageMessage);
	}

	if (!prefix) {
		return sageMessage.reactFailure("Mising prefix value. Ex: sage!!prefix set prefix=\"sage\"");
	}

	const saved = await sageMessage.server.setCommandPrefix(prefix);
	return sageMessage.reactSuccessOrFailure(saved, "Sage Prefix Set", "Unknown Error; Sage Prefix NOT Set");
}

// async function prefixGet(sageMessage: SageMessage): Promise<void> {
// 	if (!sageMessage.checkCanAdminServer()) {
// 		return sageMessage.reactBlock();
// 	}

// 	const renderableContent = createAdminRenderableContent(sageMessage.server, "<b>Server Command Prefix</b>");
// 	const commandPrefix =
// 		(sageMessage.server.commandPrefix ?? `<i>inherited (${sageMessage.bot.commandPrefix})</i>`)
// 		|| `<i>unset (no prefix)</i>`;

// 	renderableContent.append(commandPrefix);
// 	return <any>sageMessage.send(renderableContent);
// }

async function prefixSync(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyAdminServer("Reset Sage Prefix");
	if (denial) {
		return denial;
	}

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Reset Sage's command prefix to the default `sage`?");
	if (booleanResponse) {
		const saved = await sageMessage.server.syncCommandPrefix();
		await sageMessage.reactSuccessOrFailure(saved, "Sage Prefix Reset", "Unknown Error; Sage Prefix NOT Reset!");
	}
}

async function prefixUnset(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyAdminServer("Unset Sage Prefix");
	if (denial) {
		return denial;
	}

	const saved = await sageMessage.server.unsetCommandPrefix();
	return sageMessage.reactSuccessOrFailure(saved, "Sage Prefix Unset", "Unknown Error; Sage Prefix NOT Unset!");
}

export default function register(): void {
	registerAdminCommand(prefixSet, "prefix-set");
	registerAdminCommandHelp("Admin", "Prefix", "prefix set {commandPrefix; ex: sage}");

	// registerAdminCommand(prefixGet, "prefix-get");
	// registerAdminCommandHelp("Admin", "Prefix", "prefix get");

	registerAdminCommand(prefixSync, "prefix-sync", "prefix-reset");
	registerAdminCommandHelp("Admin", "Prefix", "prefix sync");
	registerAdminCommandHelp("Admin", "Prefix", "prefix reset");

	registerAdminCommand(prefixUnset, "prefix-unset");
	registerAdminCommandHelp("Admin", "Prefix", "prefix unset");
}
