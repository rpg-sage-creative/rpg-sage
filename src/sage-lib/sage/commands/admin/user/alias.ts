// import { discordPromptYesNo } from "../../../../../discord/prompts";
import type { Optional } from "@rsc-utils/type-utils";
import utils from "../../../../../sage-utils";
import { discordPromptYesNo } from "../../../../discord/prompts";
import SageMessage from "../../../model/SageMessage";
import { TAlias } from "../../../model/User";
import { DialogType } from "../../../repo/base/IdRepository";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { parseDialogContent, type TDialogContent } from "../../dialog";
import { registerAdminCommandHelp } from "../../help";


function testGmTarget(sageMessage: SageMessage, dialogContent: TDialogContent): boolean {
	if (!sageMessage.game || sageMessage.isGameMaster) {
		return !!(dialogContent.postType
			|| dialogContent.name
			|| dialogContent.displayName
			|| dialogContent.title
			|| dialogContent.imageUrl
			|| dialogContent.embedColor
			|| dialogContent.content);
	}
	return false;
}
function testNpcTarget(sageMessage: SageMessage, dialogContent: TDialogContent): boolean {
	if (sageMessage.game) {
		if (sageMessage.isGameMaster) {
			const found = sageMessage.game.nonPlayerCharacters.findByName(dialogContent.name)
				?? sageMessage.game.nonPlayerCharacters.findCompanionByName(dialogContent.name);
			return !!found;
		}
		return false;
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

function toNamePart(dialogContent: TDialogContent): string {
	const { name, displayName } = dialogContent;
	const parts = [
		name ?? ``,
		displayName ? `(${displayName})` : ``
	];
	if (dialogContent.type === "gm") {
		if (name && !displayName) {
			parts[1] = `(${name})`;
		}else if (!name && displayName) {
			parts[0] = displayName;
		}
	}
	return parts.join("");
}

function dialogContentToTarget(dialogContent: TDialogContent, separator = "::"): string {
	// dialog parts
	const baseParts = [
		dialogContent.type,
		toNamePart(dialogContent),
		dialogContent.title ? `(${dialogContent.title})` : ``,
		dialogContent.imageUrl,
		dialogContent.embedColor,
		DialogType[dialogContent.postType!],
	];
	// only valid parts
	const filteredParts = baseParts.filter(utils.StringUtils.isNotBlank);
	// push content or empty string to get final :: in the right place
	const allParts = filteredParts.concat([dialogContent.content ?? ""]);
	// join output
	return allParts.join(separator);
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
		case "npc": case "ally": case "enemy": case "boss": case "minion":
			return testNpcTarget(sageMessage, dialogContent);
		case "pc":
			return testPcTarget(sageMessage, dialogContent);
		case "alt": case "hireling": case "familiar": case "companion":
			return testCompanionTarget(sageMessage, dialogContent);
	}
	return false;
}

function aliasToPrompt(alias: TAlias, usage: boolean): string {
	const parts = [
		`\n> **Name:** ${alias.name}`,
		`\n> **Target:** \`${alias.target}\``
	];
	if (usage) {
		parts.push(`\n\n*Usage:* \`${alias.name.toLowerCase()}::\``);
	}
	return parts.join("");
}

async function aliasCreate(sageMessage: SageMessage, alias: TAlias): Promise<boolean> {
	const aliasPrompt = aliasToPrompt(alias, true);

	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Create alias?`);
	promptRenderable.append(aliasPrompt);

	const bool = await discordPromptYesNo(sageMessage, promptRenderable);
	if (bool === true) {
		return sageMessage.sageUser.aliases.pushAndSave(alias);
	}
	return false;
}

async function aliasUpdate(sageMessage: SageMessage, existing: TAlias, updated: TAlias): Promise<boolean> {
	const existingPrompt = aliasToPrompt(existing, false);
	const updatedPrompt = aliasToPrompt(updated, true);

	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Update alias?`);
	promptRenderable.append(`from:${existingPrompt}\nto:${updatedPrompt}`);

	const bool = await discordPromptYesNo(sageMessage, promptRenderable);
	if (bool === true) {
		existing.target = updated.target;
		return sageMessage.sageUser.save();
	}
	return false;
}

async function aliasSet(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDialog) {
		return sageMessage.reactBlock();
	}

	const namePair = sageMessage.args.removeKeyValuePair("name");
	const targetPair = sageMessage.args.removeKeyValuePair(/for|target|value/i);

	const aliasName = namePair?.value ?? sageMessage.args.shift()!;
	const aliasTarget = targetPair?.value ?? sageMessage.args.join(" ");

	const dialogContent = parseDialogContent(aliasTarget, sageMessage.sageUser?.allowDynamicDialogSeparator);
	if (!dialogContent || !aliasTest(sageMessage, dialogContent)) {
		return sageMessage.reactFailure();
	}

	const target = dialogContentToTarget(dialogContent);

	let saved = false;
	const oldAlias = sageMessage.sageUser.aliases.findByName(aliasName);
	const newAlias = { name: aliasName, target: target };
	if (oldAlias) {
		saved = await aliasUpdate(sageMessage, oldAlias, newAlias);
	}else {
		saved = await aliasCreate(sageMessage, newAlias);
	}
	return sageMessage.reactSuccessOrFailure(saved);
}

async function deleteAlias(sageMessage: SageMessage, alias: Optional<TAlias>): Promise<void> {
	if (!alias) {
		return sageMessage.reactFailure();
	}

	const aliasPrompt = aliasToPrompt(alias, false);
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Delete Alias?`);
	promptRenderable.append(aliasPrompt);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable);
	if (yes === true) {
		const saved = await sageMessage.sageUser.aliases.removeAndSave(alias);
		return sageMessage.reactSuccessOrFailure(saved);
	}
	return Promise.resolve();
}

async function aliasDelete(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDialog) {
		return sageMessage.reactBlock();
	}

	const aliasName = sageMessage.args.removeAndReturnName(true) ?? sageMessage.args.shift();
	if (aliasName) {
		const alias = sageMessage.sageUser.aliases.findByName(aliasName);
		return deleteAlias(sageMessage, alias);
	}
	return sageMessage.reactFailure();
}

async function aliasDetails(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin && !sageMessage.allowDice) {
		return sageMessage.reactBlock();
	}

	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>Alias Details</b>`);

	const aliasName = sageMessage.args.removeAndReturnName() ?? sageMessage.args.shift()!;
	const existing = sageMessage.sageUser.aliases.findByName(aliasName);
	if (existing) {
		renderableContent.append(aliasToPrompt(existing, true));
	} else {
		renderableContent.append(`Alias not found! \`${aliasName}\``);
	}
	return <any>sageMessage.send(renderableContent);
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
	registerAdminCommand(aliasSet, "alias-set", "alias-add");
	registerAdminCommand(aliasDetails, "alias-details");
	registerAdminCommand(aliasDelete, "alias-delete", "alias-unset", "alias-remove");

	registerAdminCommandHelp("Dialog", "Alias", "alias list");
	registerAdminCommandHelp("Dialog", "Alias", "alias set {alias} {dialog prefix}");
	registerAdminCommandHelp("Dialog", "Alias", "alias delete {alias}");
}
