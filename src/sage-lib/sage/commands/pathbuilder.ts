import * as Discord from "discord.js";
import { PathbuilderCharacter, toModifier } from "../../../sage-pf2e";
import type { TPathbuilderCharacter, TPathbuilderCharacterCustomFlags, TPathbuilderCharacterOutputType } from "../../../sage-pf2e/model/pc/PathbuilderCharacter";
import utils, { UUID } from "../../../sage-utils";
import { registerSlashCommand } from "../../../slash.mjs";
import type { TSlashCommand } from "../../../types";
import { DiscordId, DUser, TChannel } from "../../discord";
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

function saveCharacter(character: PathbuilderCharacter): Promise<boolean> {
	return utils.FsUtils.writeFile(getPath(character.id), character.toJSON(), true).catch(utils.ConsoleUtils.Catchers.errorReturnFalse);
}
async function loadCharacter(characterId: UUID): Promise<PathbuilderCharacter | null> {
	const core = await utils.FsUtils.readJsonFile<TPathbuilderCharacter>(getPath(characterId)).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
	return core ? new PathbuilderCharacter(core) : null;
}
function getPath(pathbuilderCharId: string): string {
	return `./data/sage/pb2e/${pathbuilderCharId}.json`;
}

async function postCharacter(sageCache: SageCache, channel: TChannel, character: PathbuilderCharacter, pin: boolean): Promise<void> {
	const saved = await saveCharacter(character);
	if (saved) {
		const output = prepareOutput(sageCache, character);
		const message = await channel.send(output).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
		if (pin && message?.pinnable) {
			await message.pin();
		}
	}else {
		const output = { embeds:resolveToEmbeds(sageCache, character.toHtml()) };
		const message = await channel.send(output).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
		if (pin && message?.pinnable) {
			await message.pin();
		}
	}
}

async function updateSheet(sageInteraction: SageInteraction, character: PathbuilderCharacter) {
	const output = prepareOutput(sageInteraction.caches, character);
	const message = sageInteraction.interaction.message as Discord.Message;
	await message.edit(output);
}

function createViewSelectRow(character: PathbuilderCharacter): Discord.MessageActionRow {
	const selectMenu = new Discord.MessageSelectMenu();
	selectMenu.setCustomId(`${character.id}|View`);
	selectMenu.setPlaceholder("Select Character View");

	const activeView = character.getSheetValue("activeView");
	const validOutputTypes = character.getValidOutputTypes();
	validOutputTypes.forEach((outputType, index) =>
		selectMenu.addOptions({
			label: `Character View: ${outputType}`,
			value: outputType,
			default: outputType === activeView || (!activeView && !index)
		})
	);

	return new Discord.MessageActionRow().addComponents(selectMenu);
}

const skills = "Perception,Acrobatics,Arcana,Athletics,Crafting,Deception,Diplomacy,Intimidation,Medicine,Nature,Occultism,Performance,Religion,Society,Stealth,Survival,Thievery".split(",");

function createExplorationSelectRow(character: PathbuilderCharacter): Discord.MessageActionRow {
	const selectMenu = new Discord.MessageSelectMenu();
	selectMenu.setCustomId(`${character.id}|Exploration`);
	selectMenu.setPlaceholder("Select Exploration Mode");

	const activeExploration = character.getSheetValue("activeExploration");
	const explorationModes = ["Avoid Notice", "Defend", "Detect Magic", "Follow the Expert", "Hustle", "Investigate", "Repeat a Spell", "Scout", "Search", "Other"];
	explorationModes.forEach(mode => {
		selectMenu.addOptions({
			label: `Exploration Mode: ${mode}`,
			value: mode,
			default: mode === activeExploration
		});
	});

	return new Discord.MessageActionRow().addComponents(selectMenu);
}

function createSkillSelectRow(character: PathbuilderCharacter): Discord.MessageActionRow {
	const selectMenu = new Discord.MessageSelectMenu();
	selectMenu.setCustomId(`${character.id}|Skill`);
	selectMenu.setPlaceholder("Select a Skill to Roll");

	const activeSkill = character.getSheetValue("activeSkill");
	const lores = character.lores.map(lore => lore[0]);
	const skillsAndLores = skills.concat(lores);
	skillsAndLores.forEach(skill => {
		const skillAndMod = character.getProficiencyAndMod(skill);
		selectMenu.addOptions({
			label: `Skill Roll: ${skill}${lores.includes(skill) ? " Lore" : ""} ${toModifier(skillAndMod[1])} (${skillAndMod[0]})`,
			value: skill,
			default: skill === activeSkill || (!activeSkill && skill === "Perception")
		});
	});

	return new Discord.MessageActionRow().addComponents(selectMenu);
}

function createButton(customId: string, label: string, style: Discord.MessageButtonStyleResolvable): Discord.MessageButton {
	const button = new Discord.MessageButton();
	button.setCustomId(customId);
	button.setLabel(label);
	button.setStyle(style);
	return button;
}

function createRollButtonRow(character: PathbuilderCharacter): Discord.MessageActionRow {
	// const activeSkill = character.getSheetValue<string>("activeSkill") ?? "Perception";
	// const lores = character.lores.map(lore => lore[0]);
	// const skill = lores.includes(activeSkill) ? `${activeSkill} Lore` : activeSkill;

	const rollButton = createButton(`${character.id}|Roll`, `Roll Check`, "PRIMARY");
	const rollSecretButton = createButton(`${character.id}|Secret`, `Roll Secret Check`, "PRIMARY");
	const rollInitButton = createButton(`${character.id}|Init`, `Roll Initiative`, "PRIMARY");
	return new Discord.MessageActionRow().addComponents(rollButton, rollSecretButton, rollInitButton);
}

function createComponents(character: PathbuilderCharacter): Discord.MessageActionRow[] {
	return [
		createViewSelectRow(character),
		createExplorationSelectRow(character),
		createSkillSelectRow(character),
		createRollButtonRow(character)
	];
}

type TOutput = { embeds:Discord.MessageEmbed[], components:Discord.MessageActionRow[] };
function prepareOutput(sageCache: SageCache, character: PathbuilderCharacter): TOutput {
	const activeView = character.getSheetValue<TPathbuilderCharacterOutputType>("activeView");
	const defaultView = character.getValidOutputTypes()[0];
	const outputType = activeView ?? defaultView;
	const embeds = resolveToEmbeds(sageCache, character.toHtml(outputType));
	const components = createComponents(character);
	return { embeds, components };
}

//#region button command

const uuidActionRegex = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\|(?:View|Exploration|Skill|Roll|Secret|Init)$/i;

function sheetTester(sageInteraction: SageInteraction): boolean {
	return uuidActionRegex.test(sageInteraction.interaction.customId);
}

async function viewHandler(sageInteraction: SageInteraction, character: PathbuilderCharacter): Promise<void> {
	const activeView = (sageInteraction.interaction as Discord.SelectMenuInteraction).values[0];
	character.setSheetValue("activeView", activeView);
	await saveCharacter(character);
	return updateSheet(sageInteraction, character);
}
async function explorationHandler(sageInteraction: SageInteraction, character: PathbuilderCharacter): Promise<void> {
	const activeExploration = (sageInteraction.interaction as Discord.SelectMenuInteraction).values[0];
	character.setSheetValue("activeExploration", activeExploration);
	await saveCharacter(character);
	return updateSheet(sageInteraction, character);
}
async function skillHandler(sageInteraction: SageInteraction, character: PathbuilderCharacter): Promise<void> {
	const activeSkill = (sageInteraction.interaction as Discord.SelectMenuInteraction).values[0];
	character.setSheetValue("activeSkill", activeSkill);
	await saveCharacter(character);
	return updateSheet(sageInteraction, character);
}
function getInitSkill(character: PathbuilderCharacter): string {
	const activeExploration = character.getSheetValue("activeExploration");
	switch(activeExploration) {
		case "Avoid Notice": return "Stealth";
		case "Other": return character.getSheetValue("activeSkill") ?? "Perception";
		default: return "Perception";
	}
}
async function rollHandler(sageInteraction: SageInteraction<Discord.ButtonInteraction>, character: PathbuilderCharacter, secret = false, init = false): Promise<void> {
	const skill = init ? getInitSkill(character) : character.getSheetValue<string>("activeSkill") ?? "Perception";
	const skillMod = character.getProficiencyAndMod(skill)[1];
	const incredibleMod = character.hasFeat("Incredible Initiative") ? 2 : 0;
	const scoutMod = character.getSheetValue("activeExploration") === "Scout" ? 1 : 0;
	const initMod = init ? Math.max(incredibleMod, scoutMod) : 0;
	const dice = `[1d20+${skillMod+initMod} ${character.name}${secret ? " Secret" : ""} ${skill}${init ? " (Initiative)" : ""}]`;
	const matches = parseDiceMatches(sageInteraction, dice);
	const output = matches.map(match => match.output).flat();
	const sendResults = await sendDice(sageInteraction, output);
	if (sendResults.allSecret && sendResults.hasGmChannel) {
		await sageInteraction.interaction.channel?.send(`${DiscordId.toUserMention(sageInteraction.user.id)} *Secret Dice sent to the GM* 🎲`);
	}
}
async function sheetHandler(sageInteraction: SageInteraction): Promise<void> {
	await sageInteraction.interaction.deferUpdate();
	const actionParts = sageInteraction.interaction.customId.split("|");
	const characterId = actionParts[0] as UUID;
	const character = await loadCharacter(characterId);
	if (character) {
		const command = actionParts[1] as "View" | "Exploration" | "Skill" | "Roll" | "Secret" | "Init";
		switch(command) {
			case "View": return viewHandler(sageInteraction, character);
			case "Exploration": return explorationHandler(sageInteraction, character);
			case "Skill": return skillHandler(sageInteraction, character);
			case "Roll": return rollHandler(sageInteraction, character, false);
			case "Secret": return rollHandler(sageInteraction, character, true);
			case "Init": return rollHandler(sageInteraction, character, false, true);
		}
	}
	return Promise.resolve();
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
	registerInteractionListener(sheetTester, sheetHandler);
}

export function registerSlashCommands(): void {
	registerSlashCommand(importCommand());
}
