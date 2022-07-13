import * as Discord from "discord.js";
import { PathbuilderCharacter, toModifier } from "../../../sage-pf2e";
import { getCharacterSections, TCharacterSectionType, TCharacterViewType, TPathbuilderCharacter } from "../../../sage-pf2e/model/pc/PathbuilderCharacter";
import { isDefined, Optional, UUID } from "../../../sage-utils";
import { errorReturnFalse, errorReturnNull } from "../../../sage-utils/utils/ConsoleUtils/Catchers";
import { readJsonFile, writeFile } from "../../../sage-utils/utils/FsUtils";
import { StringMatcher } from "../../../sage-utils/utils/StringUtils";
import { registerSlashCommand } from "../../../slash.mjs";
import type { TSlashCommand } from "../../../types";
import { DiscordId, DUser, TChannel } from "../../discord";
import { resolveToEmbeds } from "../../discord/embeds";
import { registerInteractionListener } from "../../discord/handlers";
import type SageCache from "../model/SageCache";
import type SageInteraction from "../model/SageInteraction";
import type User from "../model/User";
import type { TMacro } from "../model/User";
import { parseDiceMatches, sendDice } from "./dice";

type TLabeledMacro = TMacro & { prefix:string; };
function getMacros(character: PathbuilderCharacter, macroUser: Optional<User>): TLabeledMacro[] {
	if (!macroUser) {
		return [];
	}
	const attackMacros = character.getAttackMacros()
		.map(macro => ({ prefix:"Attack Roll", ...macro }));

	const matcher = new StringMatcher(character.name);
	const userMacros = macroUser.macros
		.filter(macro => matcher.matches(macro.category))
		.map(macro => ({ prefix:"Macro Roll", ...macro }));

	return attackMacros.concat(userMacros);
}
function setMacroUser(character: PathbuilderCharacter, macroUser: User): void {
	if (getMacros(character, macroUser).length > 0) {
		character.setSheetValue("macroUserId", macroUser.id);
	}else {
		character.setSheetValue("macroUserId", null);
	}
}

async function attachCharacter(sageCache: SageCache, channel: TChannel | DUser, pathbuilderId: number, character: PathbuilderCharacter, pin: boolean): Promise<void> {
	const raw = resolveToEmbeds(sageCache, character.toHtml()).map(e => e.description).join("");
	const buffer = Buffer.from(raw, "utf-8");
	const attachment = new Discord.MessageAttachment(buffer, `pathbuilder2e-${pathbuilderId}.txt`);
	const message = await channel.send({
		content: `Attaching Pathbuilder2e Character: ${character.name} (${pathbuilderId})`,
		files:[attachment]
	}).catch(errorReturnNull);
	if (pin && message?.pinnable) {
		await message.pin();
	}
	return Promise.resolve();
}

function saveCharacter(character: PathbuilderCharacter): Promise<boolean> {
	return writeFile(getPath(character.id), character.toJSON(), true).catch(errorReturnFalse);
}
async function loadCharacter(characterId: UUID): Promise<PathbuilderCharacter | null> {
	const core = await readJsonFile<TPathbuilderCharacter>(getPath(characterId)).catch(errorReturnNull);
	return core ? new PathbuilderCharacter(core) : null;
}
function getPath(pathbuilderCharId: string): string {
	return `./data/sage/pb2e/${pathbuilderCharId}.json`;
}

async function postCharacter(sageCache: SageCache, channel: TChannel, character: PathbuilderCharacter, pin: boolean): Promise<void> {
	setMacroUser(character, sageCache.user);
	const saved = await saveCharacter(character);
	if (saved) {
		const output = prepareOutput(sageCache, character, sageCache.user);
		const message = await channel.send(output).catch(errorReturnNull);
		if (pin && message?.pinnable) {
			await message.pin();
		}
	}else {
		const output = { embeds:resolveToEmbeds(sageCache, character.toHtml()) };
		const message = await channel.send(output).catch(errorReturnNull);
		if (pin && message?.pinnable) {
			await message.pin();
		}
	}
}

async function updateSheet(sageInteraction: SageInteraction, character: PathbuilderCharacter) {
	const macroUser = await sageInteraction.caches.users.getById(character.getSheetValue("macroUserId"));
	const output = prepareOutput(sageInteraction.caches, character, macroUser);
	const message = sageInteraction.interaction.message as Discord.Message;
	await message.edit(output);
}

function getActiveSections(character: PathbuilderCharacter): TCharacterSectionType[] {
	const activeView = character.getSheetValue<TCharacterViewType>("activeView");
	const activeSections = character.getSheetValue<TCharacterSectionType[]>("activeSections");
	return getCharacterSections(activeView) ?? activeSections ?? getCharacterSections("Combat") ?? [];
}
function createViewSelectRow(character: PathbuilderCharacter): Discord.MessageActionRow {
	const selectMenu = new Discord.MessageSelectMenu();
	selectMenu.setCustomId(`${character.id}|View`);
	selectMenu.setPlaceholder("Character Sheet Sections");
	selectMenu.setMinValues(1);

	const activeSections = getActiveSections(character);

	const validSectionTypes = character.getValidSectionsTypes();
	validSectionTypes.sort();
	validSectionTypes.forEach(sectionType => {
		selectMenu.addOptions({
			label: sectionType,
			value: sectionType,
			default: activeSections.includes(sectionType)
		});
	});

	const validViewTypes = character.getValidViewTypes();
	validViewTypes.forEach(view => {
		const sections = getCharacterSections(view) ?? [];
		sections.sort();
		selectMenu.addOptions({
			label: `Character View: ${view}`,
			value: sections.join(","),
			description: view === "All" ? "All Sections" : sections.join(", "),
			default: view === "All" && activeSections.includes("All")
		});
	});

	return new Discord.MessageActionRow().addComponents(selectMenu);
}

const skills = "Perception,Acrobatics,Arcana,Athletics,Crafting,Deception,Diplomacy,Intimidation,Medicine,Nature,Occultism,Performance,Religion,Society,Stealth,Survival,Thievery".split(",");
const saves = ["Fortitude", "Reflex", "Will"];

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
	const savesSkillsAndLores = saves.concat(skills, lores);
	savesSkillsAndLores.forEach(skill => {
		const labelPrefix = saves.includes(skill) ? "Save" : "Skill";
		const skillAndMod = character.getProficiencyAndMod(skill);
		selectMenu.addOptions({
			label: `${labelPrefix} Roll: ${skill}${lores.includes(skill) ? " Lore" : ""} ${toModifier(skillAndMod[1])} (${skillAndMod[0]})`,
			value: skill,
			default: skill === activeSkill || (!activeSkill && skill === "Perception")
		});
	});

	return new Discord.MessageActionRow().addComponents(selectMenu);
}

function createMacroSelectRow(character: PathbuilderCharacter, macros: TLabeledMacro[]): Discord.MessageActionRow {
	const selectMenu = new Discord.MessageSelectMenu();
	selectMenu.setCustomId(`${character.id}|Macro`);
	selectMenu.setPlaceholder("Select a Macro to Roll");

	const activeMacro = character.getSheetValue("activeMacro");
	macros.forEach(macro => {
		selectMenu.addOptions({
			label: `${macro.prefix}: ${macro.name}`,
			value: macro.name,
			default: macro.name === activeMacro
		});
	});
	selectMenu.addOptions({
		label: `Refresh Character Macro List`,
		value: `REFRESH`,
		default: false
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

function createRollButtonRow(character: PathbuilderCharacter, macros: TMacro[]): Discord.MessageActionRow {
	const rollButton = createButton(`${character.id}|Roll`, `Roll Check`, "PRIMARY");
	const rollSecretButton = createButton(`${character.id}|Secret`, `Roll Secret Check`, "PRIMARY");
	const rollInitButton = createButton(`${character.id}|Init`, `Roll Initiative`, "PRIMARY");
	const macroButton = createButton(`${character.id}|MacroRoll`, macros.length > 0 ? `Roll Macro` : `Load Macros`, "PRIMARY");
	return new Discord.MessageActionRow().addComponents(rollButton, rollSecretButton, rollInitButton, macroButton);
}

function createComponents(character: PathbuilderCharacter, macroUser: Optional<User>): Discord.MessageActionRow[] {
	const macros = getMacros(character, macroUser);
	return [
		createViewSelectRow(character),
		createExplorationSelectRow(character),
		createSkillSelectRow(character),
		macros.length > 0 ? createMacroSelectRow(character, macros) : undefined,
		createRollButtonRow(character, macros)
	].filter(isDefined);
}

type TOutput = { embeds:Discord.MessageEmbed[], components:Discord.MessageActionRow[] };
function prepareOutput(sageCache: SageCache, character: PathbuilderCharacter, macroUser: Optional<User>): TOutput {
	const embeds = resolveToEmbeds(sageCache, character.toHtml(getActiveSections(character)));
	const components = createComponents(character, macroUser);
	return { embeds, components };
}

//#region button command

const uuidActionRegex = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\|(?:View|Exploration|Skill|Macro|Roll|Secret|Init|MacroRoll)$/i;

function sheetTester(sageInteraction: SageInteraction): boolean {
	return uuidActionRegex.test(sageInteraction.interaction.customId);
}

async function viewHandler(sageInteraction: SageInteraction<Discord.SelectMenuInteraction>, character: PathbuilderCharacter): Promise<void> {
	const values = sageInteraction.interaction.values;
	const activeSections: string[] = [];
	if (values.includes("All")) {
		activeSections.push("All");
	}else {
		const activeView = values.find(value => value.includes(","));
		if (activeView) {
			activeSections.push(...activeView.split(","));
		}else {
			activeSections.push(...values);
		}
	}
	character.setSheetValue("activeView", undefined);
	character.setSheetValue("activeSections", activeSections);
	await saveCharacter(character);
	return updateSheet(sageInteraction, character);
}

async function explorationHandler(sageInteraction: SageInteraction, character: PathbuilderCharacter): Promise<void> {
	const activeExploration = (sageInteraction.interaction as Discord.SelectMenuInteraction).values[0];
	character.setSheetValue("activeExploration", activeExploration);
	await saveCharacter(character);
	return updateSheet(sageInteraction, character);
}

async function skillHandler(sageInteraction: SageInteraction<Discord.SelectMenuInteraction>, character: PathbuilderCharacter): Promise<void> {
	const activeSkill = sageInteraction.interaction.values[0];
	character.setSheetValue("activeSkill", activeSkill);
	await saveCharacter(character);
	return updateSheet(sageInteraction, character);
}

async function macroHandler(sageInteraction: SageInteraction, character: PathbuilderCharacter): Promise<void> {
	const activeMacro = sageInteraction.interaction.values[0];
	if (activeMacro === "REFRESH") {
		setMacroUser(character, sageInteraction.sageUser);
	}else {
		character.setSheetValue("activeMacro", activeMacro);
	}
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

async function macroRollHandler(sageInteraction: SageInteraction, character: PathbuilderCharacter): Promise<void> {
	const macroUser = await sageInteraction.caches.users.getById(character.getSheetValue("macroUserId"));
	const macros = getMacros(character, macroUser);
	if (!macros.length) {
		setMacroUser(character, sageInteraction.sageUser);
		await saveCharacter(character);
		await updateSheet(sageInteraction, character);
	}else {
		const activeMacro = character.getSheetValue("activeMacro");
		const macro = macros.find(m => m.name === activeMacro);
		if (macro) {
			const matches = parseDiceMatches(sageInteraction, macro.dice.replace(/\{.*?\}/g, match => match.slice(1,-1).split(":")[1] ?? ""));
			const output = matches.map(match => match.output).flat();
			await sendDice(sageInteraction, output);
		}else {
			sageInteraction.send("Invalid Macro!");
		}
	}
}

async function sheetHandler(sageInteraction: SageInteraction): Promise<void> {
	await sageInteraction.interaction.deferUpdate();
	const actionParts = sageInteraction.interaction.customId.split("|");
	const characterId = actionParts[0] as UUID;
	const character = await loadCharacter(characterId);
	if (character) {
		const command = actionParts[1] as "View" | "Exploration" | "Skill" | "Macro" | "Roll" | "Secret" | "Init" | "MacroRoll";
		switch(command) {
			case "View": return viewHandler(sageInteraction, character);
			case "Exploration": return explorationHandler(sageInteraction, character);
			case "Skill": return skillHandler(sageInteraction, character);
			case "Macro": return macroHandler(sageInteraction, character);
			case "Roll": return rollHandler(sageInteraction, character, false);
			case "Secret": return rollHandler(sageInteraction, character, true);
			case "Init": return rollHandler(sageInteraction, character, false, true);
			case "MacroRoll": return macroRollHandler(sageInteraction, character);
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

const pb2eId = "pathbuilder2e-id";

async function slashHandler(sageInteraction: SageInteraction): Promise<void> {
	if (sageInteraction.hasNumber(pb2eId)) {
		return slashHandlerPathbuilder2e(sageInteraction);
	}
	return sageInteraction.reply(`Sorry, unable to import your character at this time.`, true);
}

async function slashHandlerPathbuilder2e(sageInteraction: SageInteraction): Promise<void> {
	const pathbuilderId = sageInteraction.getNumber(pb2eId, true);
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
			{ name:pb2eId, description:"Import from Pathbuilder 2e using 'Export to JSON'", isNumber:true },
			{ name:"attach", description:"Attach as a Markdown formatted .txt", isBoolean:true },
			{ name:"pin", description:"Pin character", isBoolean:true }
		]
	};
}


//#endregion

export function registerCommandHandlers(): void {
	registerInteractionListener(slashTester, slashHandler);
	registerInteractionListener(sheetTester, sheetHandler);
}

export function registerSlashCommands(): void {
	registerSlashCommand(importCommand());
}
