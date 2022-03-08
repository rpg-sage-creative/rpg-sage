// import { discordPromptYesNo } from "../../../../../discord/prompts";
import utils from "../../../../../sage-utils";
import type SageMessage from "../../../model/SageMessage";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { type TDialogContent, parseDialogContent } from "../../dialog";
import { registerAdminCommandHelp } from "../../help";


function testGmTarget(sageMessage: SageMessage, dialogContent: TDialogContent): boolean {
	return sageMessage.isGameMaster && !dialogContent.name;
}
function testNpcTarget(sageMessage: SageMessage, dialogContent: TDialogContent): boolean {
	if (sageMessage.game) {
		return sageMessage.isGameMaster
			? sageMessage.game.nonPlayerCharacters.findByName(dialogContent.name) !== undefined
			: false;
	}
	return sageMessage.sageUser.nonPlayerCharacters.findByName(dialogContent.name) !== undefined;
}
function testPcTarget(sageMessage: SageMessage, dialogContent: TDialogContent): boolean {
	if (sageMessage.game) {
		return !!sageMessage.playerCharacter && !dialogContent.name;// && !dialogContent.displayName;
	}
	return sageMessage.sageUser.playerCharacters.findByName(dialogContent.name) !== undefined;
}
function testCompanionTarget(sageMessage: SageMessage, dialogContent: TDialogContent): boolean {
	if (sageMessage.game) {
		return sageMessage.playerCharacter?.companions.findByName(dialogContent.name) !== undefined;
	}
	return !sageMessage.sageUser.playerCharacters.findCompanionByName(dialogContent.name) !== undefined;
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
	return parts.filter(utils.StringUtils.isNotBlank).join(separator) + separator;
}

async function aliasList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDialog) {
		return sageMessage.reactBlock();
	}

	const aliases = sageMessage.sageUser.aliases;
	if (aliases.length) {
		const renderableContent = createAdminRenderableContent(sageMessage.game || sageMessage.server, `<b>alias-list</b>`);
		aliases.forEach(alias => {
			renderableContent.appendSection(`\`${alias.name}::\`\nis an alias for\n\`${alias.target}\`<br/>`);
		});
		return <any>sageMessage.send(renderableContent);

	} else {
		const renderableContent = createAdminRenderableContent(sageMessage.game || sageMessage.server, `<b>alias-list</b>`);
		renderableContent.append("<b>No Aliases Found!</b>");
		return <any>sageMessage.send(renderableContent);

	}
}

function aliasTest(sageMessage: SageMessage, dialogContent: TDialogContent): boolean {
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
async function aliasSet(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDialog) {
		return sageMessage.reactBlock();
	}

	const alias = sageMessage.args.shift()!;
	const dialogContent = parseDialogContent(sageMessage.args.join(" "), sageMessage.sageUser?.allowDynamicDialogSeparator);
	if (!dialogContent || !aliasTest(sageMessage, dialogContent)) {
		return sageMessage.reactFailure();
	}

	const target = dialogContentToTarget(dialogContent);
	const saved = await sageMessage.sageUser.aliases.pushAndSave({ name: alias, target: target });
	if (saved) {
		const renderableContent = createAdminRenderableContent(sageMessage.game || sageMessage.server, `<b>alias-set</b>`);
		renderableContent.append(`\`${alias.toLowerCase()}::\`\nis now an alias for\n\`${target}\``);
		sageMessage.send(renderableContent);
	}
	return sageMessage.reactSuccessOrFailure(saved);
}

async function aliasDelete(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDialog) {
		return sageMessage.reactBlock();
	}

	const alias = sageMessage.args.shift()!;
	const saved = await sageMessage.sageUser.aliases.removeByName(alias);
	return sageMessage.reactSuccessOrFailure(saved);
}

// async function toggleAllowDynamicDialogSeparator(sageMessage: SageMessage): Promise<void> {
// 	if (!sageMessage.allowAdmin && !sageMessage.allowDialog) {
// 		return sageMessage.reactBlock();
// 	}
// 	discordPromptYesNo(sageMessage, "Do you want to allow dynamic dialog separators?")
// 		.then(async yesNoOrNull => {
// 			if (typeof (yesNoOrNull) === "boolean") {
// 				if (yesNoOrNull !== sageMessage.sageUser.allowDynamicDialogSeparator) {
// 					sageMessage.sageUser.allowDynamicDialogSeparator = yesNoOrNull;
// 					const saved = await sageMessage.sageUser.save();
// 					return sageMessage.reactSuccessOrFailure(saved);
// 				}
// 			}
// 		})
// }

export default function register(): void {
	registerAdminCommand(aliasList, "alias-list");
	registerAdminCommand(aliasSet, "alias-set");
	registerAdminCommand(aliasDelete, "alias-delete");

	registerAdminCommandHelp("Dialog", "Alias", "alias list");
	registerAdminCommandHelp("Dialog", "Alias", "alias set {alias} {dialog prefix}");
	registerAdminCommandHelp("Dialog", "Alias", "alias delete {alias}");
}
