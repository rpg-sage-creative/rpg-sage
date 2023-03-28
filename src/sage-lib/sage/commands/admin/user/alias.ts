import { isNotBlank } from "../../../../../sage-utils/utils/StringUtils";
import { discordPromptYesNo } from "../../../../discord/prompts";
import type SageMessage from "../../../model/SageMessage";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { type TDialogContent, parseDialogContent } from "../../dialog";
import { registerAdminCommandHelp } from "../../help";


function testGmTarget(sageMessage: SageMessage, dialogContent: TDialogContent): boolean {
	return sageMessage.isGameMaster && !dialogContent.name;
}

async function testNpcTarget(sageMessage: SageMessage, dialogContent: TDialogContent): Promise<boolean> {
	if (sageMessage.game) {
		if (sageMessage.isGameMaster) {
			const nonPlayerCharacters = await sageMessage.game.fetchNonPlayerCharacters();
			return nonPlayerCharacters.findByName(dialogContent.name) !== undefined;
		}
		return false;
	}
	const nonPlayerCharacters = await sageMessage.actor.s.fetchNonPlayerCharacters();
	return nonPlayerCharacters.findByName(dialogContent.name) !== undefined;
}

async function testPcTarget(sageMessage: SageMessage, dialogContent: TDialogContent): Promise<boolean> {
	if (sageMessage.game) {
		const playerCharacter = await sageMessage.fetchPlayerCharacter();
		return !!playerCharacter && !dialogContent.name;
	}
	const playerCharacters = await sageMessage.actor.s.fetchPlayerCharacters();
	return playerCharacters.findByName(dialogContent.name) !== undefined;
}

async function testCompanionTarget(sageMessage: SageMessage, dialogContent: TDialogContent): Promise<boolean> {
	if (sageMessage.game) {
		const playerCharacter = await sageMessage.fetchPlayerCharacter();
		return playerCharacter?.companions.findByName(dialogContent.name) !== undefined;
	}
	const playerCharacters = await sageMessage.actor.s.fetchPlayerCharacters();
	return playerCharacters.findCompanionByName(dialogContent.name) !== undefined;
}

function dialogContentToTarget(dialogContent: TDialogContent, separator = "::"): string {
	const name = dialogContent.name ?? "";
	const displayName = dialogContent.displayName ? `(${dialogContent.displayName})` : ``;
	const parts = [
		dialogContent.type,
		name + displayName,
		dialogContent.title,
		dialogContent.imageUrl,
		dialogContent.embedColor,
		dialogContent.content
	];
	return parts.filter(isNotBlank).join(separator) + separator;
}

async function aliasList(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyCommand("List Aliases");
	if (denial) {
		return denial;
	}

	const aliases = sageMessage.actor.s.aliases;
	const renderableContent = createAdminRenderableContent(sageMessage.game ?? sageMessage.server, `<b>Alias List</b>`);
	if (aliases.length) {
		aliases.forEach(alias => {
			renderableContent.appendSection(`\`${alias.name}::\`\nis an alias for\n\`${alias.target}\`<br/>`);
		});
	} else {
		renderableContent.append("<b>No Aliases Found!</b>");
	}
	return <any>sageMessage.send(renderableContent);
}

async function aliasTest(sageMessage: SageMessage, dialogContent: TDialogContent): Promise<boolean> {
	switch (dialogContent.type) {
		case "gm":
			return testGmTarget(sageMessage, dialogContent);
		case "npc": case "ally": case "enemy":
			return testNpcTarget(sageMessage, dialogContent);
		case "pc":
			return testPcTarget(sageMessage, dialogContent);
		case "alt": case "hireling": case "companion":
			return testCompanionTarget(sageMessage, dialogContent);
	}
	return false;
}
async function aliasSet(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Set Alias");
	if (denial) {
		return denial;
	}

	const values = sageMessage.args.unkeyedValues();
	const alias = sageMessage.args.getString("alias") ?? sageMessage.args.getString("name");
	const dialogContent = parseDialogContent(values.join(" "), sageMessage.actor.s?.allowDynamicDialogSeparator);
	if (!alias || !dialogContent || !aliasTest(sageMessage, dialogContent)) {
		return sageMessage.reactFailure("Make sure your alias has a name and a valid character dailog command. Ex: sage!!alias set alias=\"bob\" pc::bob the fighter::");
	}

	const target = dialogContentToTarget(dialogContent);
	const saved = await sageMessage.actor.s.aliases.pushAndSave({ name: alias, target: target });
	if (saved) {
		const renderableContent = createAdminRenderableContent(sageMessage.game || sageMessage.server, `<b>alias-set</b>`);
		renderableContent.append(`\`${alias.toLowerCase()}::\`\nis now an alias for\n\`${target}\``);
		sageMessage.send(renderableContent);
	}
	return sageMessage.reactSuccessOrFailure(saved, "Alias Set", "Unknown Error; Alias NOT Set!");
}

async function aliasDelete(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Delete Alias");
	if (denial) {
		return denial;
	}

	const alias = sageMessage.args.getString("alias") ?? sageMessage.args.getString("name") ?? sageMessage.args.valueAt(0)!;
	const saved = await sageMessage.actor.s.aliases.removeByName(alias);
	return sageMessage.reactSuccessOrFailure(saved, "Alias Deleted", "Unknown Error; Alias NOT Deleted!");
}

async function aliasDeleteAll(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Delete All Aliases");
	if (denial) {
		return denial;
	}

	const count = sageMessage.actor.s.aliases.length;
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Delete All ${count} Aliases?`);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable);
	if (yes === true) {
		const saved = await sageMessage.actor.s.aliases.emptyAndSave();
		await sageMessage.reactSuccessOrFailure(saved, "All Aliases Deleted", "Unknown Error; All Aliases NOT Deleted!");
	}
	return Promise.resolve();
}

// async function toggleAllowDynamicDialogSeparator(sageMessage: SageMessage): Promise<void> {
// 	if (!sageMessage.allowAdmin && !sageMessage.allowDialog) {
// 		return sageMessage.reactBlock();
// 	}
// 	discordPromptYesNo(sageMessage, "Do you want to allow dynamic dialog separators?")
// 		.then(async yesNoOrNull => {
// 			if (typeof (yesNoOrNull) === "boolean") {
// 				if (yesNoOrNull !== sageMessage.actor.s.allowDynamicDialogSeparator) {
// 					sageMessage.actor.s.allowDynamicDialogSeparator = yesNoOrNull;
// 					const saved = await sageMessage.actor.s.save();
// 					return sageMessage.reactSuccessOrFailure(saved);
// 				}
// 			}
// 		})
// }

export default function register(): void {
	registerAdminCommand(aliasList, "alias-list");
	registerAdminCommand(aliasSet, "alias-set");
	registerAdminCommand(aliasDelete, "alias-delete");
	registerAdminCommand(aliasDeleteAll, "alias-delete-all");

	registerAdminCommandHelp("Dialog", "Alias", "alias list");
	registerAdminCommandHelp("Dialog", "Alias", `alias set alias="Grog" pc::Grog the Wizard::`);
	registerAdminCommandHelp("Dialog", "Alias", `alias delete alias="Grog"`);
	registerAdminCommandHelp("Dialog", "Alias", `alias delete all"`);
}
