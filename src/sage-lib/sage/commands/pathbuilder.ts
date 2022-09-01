import * as Discord from "discord.js";
import { PathbuilderCharacter, toModifier } from "../../../sage-pf2e";
import { getCharacterSections, TCharacterSectionType, TCharacterViewType, TPathbuilderCharacter } from "../../../sage-pf2e/model/pc/PathbuilderCharacter";
import { isDefined, Optional, UUID } from "../../../sage-utils";
import { errorReturnFalse, errorReturnNull } from "../../../sage-utils/utils/ConsoleUtils/Catchers";
import { fileExistsSync, readJsonFile, writeFile } from "../../../sage-utils/utils/FsUtils";
import { StringMatcher } from "../../../sage-utils/utils/StringUtils";
import { DiscordId, DUser, TChannel } from "../../discord";
import { resolveToEmbeds } from "../../discord/embeds";
import { registerInteractionListener } from "../../discord/handlers";
import type SageCache from "../model/SageCache";
import type SageInteraction from "../model/SageInteraction";
import type User from "../model/User";
import type { TMacro } from "../model/User";
import { parseDiceMatches, sendDice } from "./dice";

function createSelectMenuRow(selectMenu: Discord.MessageSelectMenu): Discord.MessageActionRow {
	if (selectMenu.options.length > 25) {
		selectMenu.options.length = 25;
	}
	return new Discord.MessageActionRow().addComponents(selectMenu);
}

type TLabeledMacro = TMacro & { id:string; prefix:string; };
function getAttackMacros(character: PathbuilderCharacter): TLabeledMacro[] {
	return character.getAttackMacros()
		.map((macro, index) => ({ id:`atk-${index}`, prefix:"Attack Roll", ...macro }));
}
function getUserMacros(character: PathbuilderCharacter, macroUser: Optional<User>): TLabeledMacro[] {
	if (macroUser) {
		const matcher = new StringMatcher(character.name);
		return macroUser.macros
			.filter(macro => matcher.matches(macro.category))
			.map((macro, index) => ({ id:`usr-${index}`, prefix:"Macro Roll", ...macro }));
	}
	return [];
}
function getMacros(character: PathbuilderCharacter, macroUser: Optional<User>): TLabeledMacro[] {
	// create attack rolls
	const attackMacros = getAttackMacros(character);
	const userMacros = getUserMacros(character, macroUser);
	const slicedMacros: TLabeledMacro[] = [];

	// Remove attacks first
	while (attackMacros.length && tooMany(attackMacros, userMacros)) {
		slicedMacros.push(attackMacros.pop()!);
	}

	// Remove their macros last
	while (tooMany(attackMacros, userMacros)) {
		slicedMacros.push(userMacros.pop()!);
	}

	character.setSheetValue("slicedMacros", slicedMacros.map(macro => macro.name));

	return attackMacros.concat(userMacros);

	function tooMany(arrOne: TLabeledMacro[], arrTwo: TLabeledMacro[]): boolean {
		return arrOne.length + arrTwo.length > 24;
	}
}
function setMacroUser(character: PathbuilderCharacter, macroUser: User): void {
	if (getUserMacros(character, macroUser).length > 0) {
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
function charFileExists(characterId: string): boolean {
	return fileExistsSync(getPath(characterId));
}
function getPath(characterId: string): string {
	return `./data/sage/pb2e/${characterId}.json`;
}

async function notifyOfSlicedMacros(sageCache: SageCache, character: PathbuilderCharacter): Promise<void> {
	const slicedMacros = character.getSheetValue<string[]>("slicedMacros") ?? [];
	if (slicedMacros.length) {
		const user = await sageCache.discord.fetchUser(sageCache.user.did);
		if (user) {
			await user.send({ content:`While importing ${character.name}, the combined list of attacks and custom macros exceeded the allowed number of options. The following macros were not displayed to avoid errors:\n> ${slicedMacros.join(", ")}` });
		}
	}
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
		await notifyOfSlicedMacros(sageCache, character);
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
	await notifyOfSlicedMacros(sageInteraction.caches, character);
}

function getActiveSections(character: PathbuilderCharacter): TCharacterSectionType[] {
	const activeView = character.getSheetValue<TCharacterViewType>("activeView");
	const activeSections = character.getSheetValue<TCharacterSectionType[]>("activeSections");
	return getCharacterSections(activeView) ?? activeSections ?? getCharacterSections("Combat") ?? [];
}
function createViewSelectRow(character: PathbuilderCharacter): Discord.MessageActionRow {
	const selectMenu = new Discord.MessageSelectMenu();
	selectMenu.setCustomId(`PB2E|${character.id}|View`);
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

	return createSelectMenuRow(selectMenu);
}

const skills = "Perception,Acrobatics,Arcana,Athletics,Crafting,Deception,Diplomacy,Intimidation,Medicine,Nature,Occultism,Performance,Religion,Society,Stealth,Survival,Thievery".split(",");
const saves = ["Fortitude", "Reflex", "Will"];

function createExplorationSelectRow(character: PathbuilderCharacter): Discord.MessageActionRow {
	const selectMenu = new Discord.MessageSelectMenu();
	selectMenu.setCustomId(`PB2E|${character.id}|Exploration`);
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

	return createSelectMenuRow(selectMenu);
}

function createSkillSelectRow(character: PathbuilderCharacter): Discord.MessageActionRow {
	const selectMenu = new Discord.MessageSelectMenu();
	selectMenu.setCustomId(`PB2E|${character.id}|Skill`);
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

	return createSelectMenuRow(selectMenu);
}

function createMacroSelectRow(character: PathbuilderCharacter, macros: TLabeledMacro[]): Discord.MessageActionRow {
	const selectMenu = new Discord.MessageSelectMenu();
	selectMenu.setCustomId(`PB2E|${character.id}|Macro`);
	selectMenu.setPlaceholder("Select a Macro to Roll");

	const activeMacro = character.getSheetValue("activeMacro");
	macros.forEach(macro => {
		selectMenu.addOptions({
			label: `${macro.prefix}: ${macro.name}`,
			value: macro.id,
			default: macro.id === activeMacro
		});
	});
	selectMenu.addOptions({
		label: `Refresh Character Macro List`,
		value: `REFRESH`,
		default: false
	});

	return createSelectMenuRow(selectMenu);
}

function createButton(customId: string, label: string, style: Discord.MessageButtonStyleResolvable): Discord.MessageButton {
	const button = new Discord.MessageButton();
	button.setCustomId(customId);
	button.setLabel(label);
	button.setStyle(style);
	return button;
}

function createRollButtonRow(character: PathbuilderCharacter, macros: TMacro[]): Discord.MessageActionRow {
	const rollButton = createButton(`PB2E|${character.id}|Roll`, `Roll Check`, "PRIMARY");
	const rollSecretButton = createButton(`PB2E|${character.id}|Secret`, `Roll Secret Check`, "PRIMARY");
	const rollInitButton = createButton(`PB2E|${character.id}|Init`, `Roll Initiative`, "PRIMARY");
	const macroButton = createButton(`PB2E|${character.id}|MacroRoll`, macros.length > 0 ? `Roll Macro` : `Load Macros`, "PRIMARY");
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

type TActionIdType = ["PB2E", UUID, "View" | "Exploration" | "Skill" | "Macro" | "Roll" | "Secret" | "Init" | "MacroRoll"];

const _uuidActionRegex = /^(?:PB2E\|)*(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\|(?:View|Exploration|Skill|Macro|Roll|Secret|Init|MacroRoll)$/i;
function matchesOldActionRegex(customId: string): boolean {
	return _uuidActionRegex.test(customId);
}

const uuidActionRegex = /^(?:PB2E)\|(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\|(?:View|Exploration|Skill|Macro|Roll|Secret|Init|MacroRoll)$/i;
function matchesActionRegex(customId: string): boolean {
	return uuidActionRegex.test(customId);
}

function parseCustomId(customId: string): TActionIdType {
	const parts = customId.split("|");
	while (parts[0] === "PB2E") {
		parts.shift();
	}
	parts.unshift("PB2E");
	return parts as TActionIdType;
}

function sheetTester(sageInteraction: SageInteraction): boolean {
	const customId = sageInteraction.interaction.customId;
	// old regex didn't include PB2E, which was added when E20 importer was made
	const matches = matchesActionRegex(customId) || matchesOldActionRegex(customId);
	if (matches) {
		/*
		house of cards!
		parseCustomId allows for old and new regex by stripping PB2E off and adding it back on
		there might be a stray character sheet that is E20
		so we check that the file exists in the PB2E folder
		TODO: figure out when this can go away!
		*/
		const [_pb2e, characterId] = parseCustomId(customId);
		return _pb2e === "PB2E" && charFileExists(characterId);
	}
	return false;
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
	const activeMacro = character.getSheetValue("activeMacro");
	const macros = getMacros(character, macroUser);
	// check by id first (proper) then by name second (fallback to old renders)
	const macro = macros.find(m => m.id === activeMacro) ?? macros.find(m => m.name === activeMacro);
	if (macro) {
		const matches = parseDiceMatches(sageInteraction, macro.dice.replace(/\{.*?\}/g, match => match.slice(1,-1).split(":")[1] ?? ""));
		const output = matches.map(match => match.output).flat();
		await sendDice(sageInteraction, output);
	}else {
		setMacroUser(character, sageInteraction.sageUser);
		await saveCharacter(character);
		await updateSheet(sageInteraction, character);
		if (macros.length) {
			sageInteraction.send("Invalid Macro!");
		}
	}
}

async function sheetHandler(sageInteraction: SageInteraction): Promise<void> {
	await sageInteraction.interaction.deferUpdate();
	const customId = sageInteraction.interaction.customId;
	const [_PB2E, characterId, command] = parseCustomId(customId);
	const character = await loadCharacter(characterId);
	if (character) {

		// if we matched the old regex, force the sheet to update
		if (!matchesActionRegex(customId)) {
			await updateSheet(sageInteraction, character);
		}

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

export const pb2eId = "pathbuilder2e-id";

export async function slashHandlerPathbuilder2e(sageInteraction: SageInteraction): Promise<void> {
	const pathbuilderId = sageInteraction.getNumber(pb2eId, true);
	await sageInteraction.reply(`Fetching Pathbuilder 2e character using 'Export JSON' id: ${pathbuilderId}`, false);

	const pathbuilderChar = await PathbuilderCharacter.fetch(pathbuilderId, { });
	if (!pathbuilderChar) {
		return sageInteraction.reply(`Failed to fetch Pathbuilder 2e character using 'Export JSON' id: ${pathbuilderId}!`, false);
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

//#endregion

export function registerCommandHandlers(): void {
	registerInteractionListener(sheetTester, sheetHandler);
}

