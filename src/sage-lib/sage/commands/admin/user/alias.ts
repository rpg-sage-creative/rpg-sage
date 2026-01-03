import { isNotBlank } from "@rsc-utils/core-utils";
import { parseDialogContent, type DialogContent } from "@rsc-utils/game-utils";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import type { TAlias } from "../../../model/User.js";
import { DialogType } from "../../../repo/base/IdRepository.js";
import { createAdminRenderableContent } from "../../cmd.js";

function testGmTarget(sageMessage: SageMessage, dialogContent: DialogContent): boolean {
	if (!sageMessage.game || sageMessage.isGameMaster) {
		return !!(dialogContent.name
			|| dialogContent.displayName
			|| dialogContent.postType
			|| dialogContent.embedColor
			|| dialogContent.embedImageUrl
			|| dialogContent.dialogImageUrl
			|| dialogContent.content);
	}
	return false;
}
function testNpcTarget(sageMessage: SageMessage, dialogContent: DialogContent): boolean {
	if (dialogContent.name?.toLowerCase() === "{name}") {
		return true;
	}
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
function testPcTarget(sageMessage: SageMessage, dialogContent: DialogContent): boolean {
	if (dialogContent.name?.toLowerCase() === "{name}") {
		return true;
	}
	if (sageMessage.game) {
		return !!sageMessage.playerCharacter && !dialogContent.name;// && !dialogContent.displayName;
	}
	return sageMessage.sageUser.playerCharacters.findByName(dialogContent.name) !== undefined;
}
function testCompanionTarget(sageMessage: SageMessage, dialogContent: DialogContent): boolean {
	if (dialogContent.name?.toLowerCase() === "{name}") {
		return true;
	}
	if (sageMessage.game) {
		return sageMessage.playerCharacter?.companions.findByName(dialogContent.name) !== undefined;
	}
	return !sageMessage.sageUser.playerCharacters.findCompanionByName(dialogContent.name) !== undefined;
}

function toNamePart(dialogContent: DialogContent): string {
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

function dialogContentToTarget(dialogContent: DialogContent, separator = "::"): string {
	// dialog parts
	const baseParts = [
		dialogContent.type,
		toNamePart(dialogContent),
		dialogContent.embedImageUrl,
		dialogContent.dialogImageUrl ? `dialog=${dialogContent.dialogImageUrl}` : undefined,
		dialogContent.embedColor,
		DialogType[dialogContent.postType!],
	];
	// only valid parts
	const filteredParts = baseParts.filter(isNotBlank);
	// push content or empty string to get final :: in the right place
	const allParts = filteredParts.concat([dialogContent.content ?? ""]);
	// join output
	return allParts.join(separator);
}

async function aliasList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowCommand && !sageMessage.allowDialog) {
		return sageMessage.denyByProv("Alias List", "You cannot manage your aliases here.");
	}

	const aliases = sageMessage.sageUser.aliases;
	if (aliases.length) {
		const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>Alias List</b>`);
		aliases.forEach((alias, index) => {
			const newLine = index ? "\n" : "";
			const target = alias.target.replace(/\n/g, "\n> ");
			renderableContent.appendSection(`${newLine}\`${alias.name}::\` is an alias for:\n> \`\`\`${target}\`\`\``);
		});
		await sageMessage.sendPost(renderableContent);

	} else {
		const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>Alias List</b>`);
		renderableContent.append("<b>No Aliases Found!</b>");
		await sageMessage.sendPost(renderableContent);

	}
}

function aliasTest(sageMessage: SageMessage, dialogContent: DialogContent): boolean {
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
		`> **Name:** ${alias.name}`,
		`\n> **Target:** \`\`\`${alias.target.replace(/\n/g, "\n> ")}\`\`\``
	];
	if (usage) {
		parts.push(`\n*Usage:* \`${alias.name.toLowerCase()}::\``);
	}
	return parts.join("");
}

async function aliasCreate(sageMessage: SageMessage, alias: TAlias): Promise<boolean> {
	const aliasPrompt = aliasToPrompt(alias, true);

	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Create alias?`);
	promptRenderable.append(aliasPrompt);

	const bool = await discordPromptYesNo(sageMessage, promptRenderable, true);
	if (bool === true) {
		return sageMessage.sageUser.aliases.pushAndSave(alias);
	}
	return false;
}

async function aliasUpdate(sageMessage: SageMessage, existing: TAlias, updated: TAlias): Promise<boolean> {
	const existingPrompt = aliasToPrompt(existing, false);
	const updatedPrompt = aliasToPrompt(updated, true);

	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Update alias?`);
	promptRenderable.append(`from:\n${existingPrompt}to:\n${updatedPrompt}`);

	const bool = await discordPromptYesNo(sageMessage, promptRenderable, true);
	if (bool === true) {
		existing.target = updated.target;
		return sageMessage.sageUser.save();
	}
	return false;
}

async function aliasSet(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowCommand && !sageMessage.allowDialog) {
		return sageMessage.denyByProv("Set Alias", "You cannot manage your aliases here.");
	}

	const aliasName = sageMessage.args.getString("name");
	const aliasTarget = sageMessage.args.getString("for")
		?? sageMessage.args.getString("target")
		?? sageMessage.args.getString("value");

	const dialogContent = aliasTarget ? parseDialogContent(aliasTarget) : null;
	const validTarget = dialogContent ? aliasTest(sageMessage, dialogContent) : false;
	if (!aliasName || !aliasTarget || !dialogContent || !validTarget) {
		const details = [
			"The command for setting an advanced alias is:",
			"> ```sage! alias set name=\"\" value=\"\"```",
			"For example:",
			"> ```sage! alias set name=\"gobfireball\" value=\"npc::gobbo::Gobbo grabs his torch, waves it around, and casts fireball with it!\"```",
		];
		if (aliasTarget) {
			if (!dialogContent) {
				details.push("Error:\n> Please format your alias value using Sage Dialog notation: `pc::dialog` or `npc::gobbo::dialog`");
			}else if (!validTarget) {
				details.push("Error:\n> Please ensure your alias includes a valid character: `pc::dialog` or `npc::gobbo::dialog`");
			}
		}
		return sageMessage.whisper(details.join("\n"));
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

async function deleteAlias(sageMessage: SageMessage, alias: TAlias): Promise<void> {
	const aliasPrompt = aliasToPrompt(alias, false);
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors(), `Delete Alias?`);
	promptRenderable.append(aliasPrompt);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable, true);
	if (yes === true) {
		const saved = await sageMessage.sageUser.aliases.removeAndSave(alias);
		return sageMessage.reactSuccessOrFailure(saved);
	}
	return Promise.resolve();
}

async function aliasDelete(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowCommand && !sageMessage.allowDialog) {
		return sageMessage.denyByProv("Delete Alias", "You cannot manage your aliases here.");
	}

	const aliasName = sageMessage.args.getString("name");
	const alias = aliasName ? sageMessage.sageUser.aliases.findByName(aliasName) : null;
	if (!aliasName || !alias) {
		const details = [
			"The command for deleting an advanced alias is:",
			"> ```sage! alias delete name=\"\"```",
			"For example:",
			"> ```sage! alias delete name=\"gobfireball\"```",
		];
		if (aliasName && !alias) {
			details.push(`Error:\n> Unable to find Alias: "${aliasName}"`);
		}
		return sageMessage.whisper(details.join("\n"));
	}

	return deleteAlias(sageMessage, alias);
}

async function aliasDetails(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowCommand && !sageMessage.allowDice) {
		return sageMessage.denyByProv("Alias Details", "You cannot manage your aliases here.");
	}

	const aliasName = sageMessage.args.getString("name");
	const alias = aliasName ? sageMessage.sageUser.aliases.findByName(aliasName) : null;
	if (!aliasName || !alias) {
		const details = [
			"The command for viewing an advanced alias is:",
			"> ```sage! alias details name=\"\"```",
			"For example:",
			"> ```sage! alias details name=\"gobfireball\"```",
		];
		if (aliasName && !alias) {
			details.push(`Error:\n> Unable to find Alias: "${aliasName}"`);
		}
		return sageMessage.whisper(details.join("\n"));
	}

	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>Alias Details</b>`);
	renderableContent.append(aliasToPrompt(alias, true));
	return <any>sageMessage.sendPost(renderableContent);
}

async function aliasHelp(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowCommand && !sageMessage.allowDice) {
		return sageMessage.denyByProv("Alias Details", "You cannot manage your aliases here.");
	}
	const details = [
		"The command for listing advanced aliases is:",
		"> ```sage! alias list```",
		"The command for viewing an advanced alias is:",
		"> ```sage! alias details name=\"\"```",
		"The command for setting an advanced alias is:",
		"> ```sage! alias set name=\"\" value=\"\"```",
		"The command for deleting an advanced alias is:",
		"> ```sage! alias delete name=\"\"```",
	];
	return sageMessage.whisper(details.join("\n"));

}

export function registerAlias(): void {
	registerListeners({ commands:["alias|help", "alias"], message:aliasHelp });
	registerListeners({ commands:["alias|list"], message:aliasList });
	registerListeners({ commands:["alias|set", "alias|add", "alias|create"], message:aliasSet });
	registerListeners({ commands:["alias|details", "alias|view"], message:aliasDetails });
	registerListeners({ commands:["alias|unset", "alias|remove", "alias|delete"], message:aliasDelete });
}
