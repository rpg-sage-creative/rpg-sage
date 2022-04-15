import * as Discord from "discord.js";
import type { TDiceOutput } from "../../../sage-dice";
import { PathbuilderCharacter } from "../../../sage-pf2e";
import type { TPathbuilderCharacter, TPathbuilderCharacterCustomFlags, TPathbuilderCharacterOutputType } from "../../../sage-pf2e/model/pc/PathbuilderCharacter";
import utils, { UUID } from "../../../sage-utils";
import { registerSlashCommand } from "../../../slash.mjs";
import type { TSlashCommand } from "../../../types";
import type { DUser, TChannel } from "../../discord";
import { resolveToEmbeds } from "../../discord/embeds";
import { registerInteractionListener } from "../../discord/handlers";
import { discordPromptYesNo } from "../../discord/prompts";
import type SageCache from "../model/SageCache";
import type SageInteraction from "../model/SageInteraction";
import type SageMessage from "../model/SageMessage";
import { registerAdminCommand } from "./cmd";
import { parseDiceMatches, sendDice } from "./dice";

async function pathbuilder2e(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin) {
		return sageMessage.reactBlock();
	}

	// const showAction = sageMessage.args.find(arg => arg.toLowerCase() === "show");
	const pinAction = !!sageMessage.args.find(arg => arg.toLowerCase() === "pin");

	const idArg = sageMessage.args.find(arg => arg.match(/^id=\d+$/i));
	if (!idArg) {
		return sageMessage.reactWarn();
	}

	const pathbuilderId = +idArg.split("=")[1];
	const flags: TPathbuilderCharacterCustomFlags = { };
	if (false) {
		flags._proficiencyWithoutLevel = true;
		flags._untrainedPenalty = true;
	}
	const pathbuilderChar = await PathbuilderCharacter.fetch(pathbuilderId, flags);
	if (!pathbuilderChar) {
		console.log(`Failed to fetch Pathbuilder character ${pathbuilderId}!`);
		return sageMessage.reactWarn();
	}

	if (sageMessage.args.includes("attach")) {
		return attachCharacter(sageMessage.caches, sageMessage.message.channel as TChannel, pathbuilderId, pathbuilderChar, pinAction);
	}

	const messages = await sageMessage.send(`*Pathbuilder2e:${pathbuilderId}*\n` + pathbuilderChar.toHtml());
	if (pinAction && messages[0]?.pinnable) {
		await messages[0].pin();
	}

	if (sageMessage.playerCharacter?.name === pathbuilderChar.name) {
		const bool = await discordPromptYesNo(sageMessage, `Update ${pathbuilderChar.name}?`);
		if (bool === true) {
			const updated = await sageMessage.playerCharacter.update({ pathbuilder:pathbuilderChar.toJSON() });
			await sageMessage.reactSuccessOrFailure(updated);
		}
	}else if (sageMessage.isPlayer) {
		if (sageMessage.playerCharacter) {
			const bool = await discordPromptYesNo(sageMessage, `Replace ${sageMessage.playerCharacter.name} with ${pathbuilderChar.name}?`);
			if (bool === true) {
				const replaced = await sageMessage.playerCharacter.update({ pathbuilder:pathbuilderChar.toJSON() });
				await sageMessage.reactSuccessOrFailure(replaced);
			}
		}else {
			const bool = await discordPromptYesNo(sageMessage, `Import ${pathbuilderChar.name}?`);
			if (bool === true) {
				const added = await sageMessage.game?.playerCharacters.addCharacter({
					id: utils.UuidUtils.generate(),
					pathbuilder: pathbuilderChar.toJSON(),
					name: pathbuilderChar.name,
					userDid: sageMessage.sageUser.did
				});
				await sageMessage.reactSuccessOrFailure(added !== null);
			}
		}
	}
}

async function attachCharacter(sageCache: SageCache, channel: TChannel | DUser, pathbuilderId: number, pathbuilderChar: PathbuilderCharacter, pin: boolean): Promise<void> {
	const raw = resolveToEmbeds(sageCache, pathbuilderChar.toHtml()).map(e => e.description).join("");
	const buffer = Buffer.from(raw, "utf-8");
	const attachment = new Discord.MessageAttachment(buffer, `pathbuilder2e-${pathbuilderId}.txt`);
	const message = await channel.send({
		content: `Attaching Pathbuilder2e Character: ${pathbuilderChar.name} (${pathbuilderId})`,
		files:[attachment]
	}).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
	if (pin && message?.pinnable) {
		await message.pin();
	}
	return Promise.resolve();
}

function getPath(pathbuilderCharId: string): string {
	return `./data/sage/pb2e/${pathbuilderCharId}.json`;
}

async function postCharacter(sageCache: SageCache, channel: TChannel, pathbuilderChar: PathbuilderCharacter, pin: boolean): Promise<void> {
	const saved = await utils.FsUtils.writeFile(getPath(pathbuilderChar.id), pathbuilderChar.toJSON(), true).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
	if (saved) {
		const output = prepareOutput(sageCache, pathbuilderChar, "Combat");
		const message = await channel.send(output).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
		if (pin && message?.pinnable) {
			await message.pin();
		}
	}else {
		const output = { embeds:resolveToEmbeds(sageCache, pathbuilderChar.toHtml()) };
		const message = await channel.send(output).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
		if (pin && message?.pinnable) {
			await message.pin();
		}
	}
}

function createButton(pathbuilderCharId: UUID, label: string, activeButton: TPathbuilderCharacterOutputType): Discord.MessageButton {
	const button = new Discord.MessageButton();
	button.setCustomId(`${pathbuilderCharId}|${label}`);
	button.setDisabled(label === activeButton);
	button.setLabel(label);
	button.setStyle("SECONDARY");
	return button;
}
function createButtonRows(pathbuilderChar: PathbuilderCharacter, activeButton: TPathbuilderCharacterOutputType): Discord.MessageActionRow[] {
	const actionRows: Discord.MessageActionRow[] = [];
	let actionRow: Discord.MessageActionRow;
	const buttonLabels = pathbuilderChar.getValidOutputTypes();
	buttonLabels.forEach(label => {
		if (!actionRow || actionRow.components.length === 5) {
			actionRow = new Discord.MessageActionRow();
			actionRows.push(actionRow);
		}
		const button = createButton(pathbuilderChar.id, label, activeButton);
		actionRow.addComponents(button);
	});

	const perceptionButton = new Discord.MessageButton();
	perceptionButton.setCustomId(`${pathbuilderChar.id}|Perception`);
	perceptionButton.setLabel("Roll Perception");
	perceptionButton.setStyle("PRIMARY");

	actionRow = new Discord.MessageActionRow();
	actionRow.addComponents(perceptionButton);
	actionRows.push(actionRow);

	return actionRows;
}

type TOutput = { embeds:Discord.MessageEmbed[], components:Discord.MessageActionRow[] };
function prepareOutput(sageCache: SageCache, pathbuilderChar: PathbuilderCharacter, outputType: TPathbuilderCharacterOutputType): TOutput {
	const embeds = resolveToEmbeds(sageCache, pathbuilderChar.toHtml(outputType));
	const components = createButtonRows(pathbuilderChar, outputType);
	return { embeds, components };
}

//#region button command

const uuidActionRegex = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\|(?:All|Combat|Equipment|Feats|Formulas|Pets|Spells|Perception)$/i;

function buttonTester(sageInteraction: SageInteraction<Discord.ButtonInteraction>): boolean {
	return sageInteraction.interaction.isButton()
		&& uuidActionRegex.test(sageInteraction.interaction.customId);
}

// function toggleButtons(actionRow: Discord.MessageActionRow, activeButton: TPathbuilderCharacterOutputType): void {
// 	actionRow.components.forEach(button => {
// 		if (button instanceof Discord.MessageButton) {
// 			button.setDisabled(button.label === activeButton);
// 		}
// 	});
// }

async function buttonHandler(sageInteraction: SageInteraction<Discord.ButtonInteraction>): Promise<void> {
	await sageInteraction.interaction.deferUpdate();
	const actionParts = sageInteraction.interaction.customId.split("|");
	const pathbuilderCharId = actionParts[0] as UUID;
	const core = await utils.FsUtils.readJsonFile<TPathbuilderCharacter>(getPath(pathbuilderCharId));
	if (core) {
		const pathbuilderChar = new PathbuilderCharacter(core);
		if (actionParts[1] === "Perception") {
			const dice = `[1d20+${pathbuilderChar.perceptionMod} ${pathbuilderChar.name} Perception]`;
			const matches = parseDiceMatches(sageInteraction, dice);
			const output = matches.reduce((out, match) => { out.push(...match.output); return out; }, <TDiceOutput[]>[]);
			sendDice(sageInteraction, output);
		}else {
			const outputType = actionParts[1] as TPathbuilderCharacterOutputType;
			const output = prepareOutput(sageInteraction.caches, pathbuilderChar, outputType);
			const message = sageInteraction.interaction.message as Discord.Message;
			await message.edit(output);
		}
	}
}

//#endregion

//#region slash command
//118142
function slashTester(sageInteraction: SageInteraction): boolean {
	return sageInteraction.isCommand("import");
}

async function slashHandler(sageInteraction: SageInteraction): Promise<void> {
	if (sageInteraction.hasNumber("pathbuilder2e-id")) {
		return slashHandlerPathbuilder2e(sageInteraction);
	}
	return sageInteraction.reply(`Sorry, unable to import your character at this time.`, true);
}

async function slashHandlerPathbuilder2e(sageInteraction: SageInteraction): Promise<void> {
	const pathbuilderId = sageInteraction.getNumber("pathbuilder2e-id", true);
	await sageInteraction.reply(`Fetching Pathbuilder 2e character using 'Export JSON' id: ${pathbuilderId}`, true);

	const pathbuilderChar = await PathbuilderCharacter.fetch(pathbuilderId, { });
	if (!pathbuilderChar) {
		return sageInteraction.reply(`Failed to fetch Pathbuilder 2e character using 'Export JSON' id: ${pathbuilderId}!`, true);
	}

	const channel = sageInteraction.interaction.channel as TChannel ?? sageInteraction.user;

	const pin = sageInteraction.getBoolean("pin") ?? false;
	const attach = sageInteraction.getBoolean("attach") ?? false;
	if (attach) {
		await attachCharacter(sageInteraction.caches, channel, pathbuilderId, pathbuilderChar, pin);
	}else {
		await postCharacter(sageInteraction.caches, channel, pathbuilderChar, pin);
	}
	return sageInteraction.deleteReply();
}

function importCommand(): TSlashCommand {
	return {
		name: "Import",
		description: "Import a character to Sage",
		options: [
			{ name:"pathbuilder2e-id", description:"Import from Pathbuilder 2e using 'Export to JSON'", isNumber:true },
			{ name:"attach", description:"Attach as a Markdown formatted .txt", isBoolean:true },
			{ name:"pin", description:"Pin character", isBoolean:true }
		]
	};
}


//#endregion

export function registerCommandHandlers(): void {
	registerAdminCommand(pathbuilder2e, "pathbuilder2e");
	registerInteractionListener(slashTester, slashHandler);
	registerInteractionListener(buttonTester, buttonHandler);
}

export function registerSlashCommands(): void {
	registerSlashCommand(importCommand());
}
