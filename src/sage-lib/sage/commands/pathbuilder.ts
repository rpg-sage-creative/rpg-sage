import { toUnique } from "@rsc-utils/array-utils";
import { errorReturnNull } from "@rsc-utils/core-utils";
import { DiscordKey, toUserMention, type DMessageChannel, type DMessageTarget } from "@rsc-utils/discord-utils";
import { isNotBlank, StringMatcher } from "@rsc-utils/string-utils";
import type { Optional } from "@rsc-utils/core-utils";
import { isDefined } from "@rsc-utils/core-utils";
import type { UUID } from "@rsc-utils/core-utils";
import { MessageActionRow, MessageAttachment, MessageButton, MessageSelectMenu, type ButtonInteraction, type Message, type MessageButtonStyleResolvable, type MessageEmbed, type SelectMenuInteraction } from "discord.js";
import { getExplorationModes, getSavingThrows, getSkills, PathbuilderCharacter, toModifier } from "../../../sage-pf2e/index.js";
import { getCharacterSections, type TCharacterSectionType, type TCharacterViewType } from "../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { registerInteractionListener } from "../../discord/handlers.js";
import { resolveToEmbeds } from "../../discord/resolvers/resolveToEmbeds.js";
import type { SageCache } from "../model/SageCache.js";
import type { SageCommand } from "../model/SageCommand.js";
import type { SageInteraction } from "../model/SageInteraction.js";
import type { SageMessage } from "../model/SageMessage.js";
import type { User } from "../model/User.js";
import type { TMacro } from "../model/types.js";
import { createMessageDeleteButtonComponents } from "../model/utils/deleteButton.js";
import { parseDiceMatches, sendDice } from "./dice.js";

type SageButtonInteraction = SageInteraction<ButtonInteraction>;
type SageSelectInteraction = SageInteraction<SelectMenuInteraction>;

function createSelectMenuRow(selectMenu: MessageSelectMenu): MessageActionRow {
	if (selectMenu.options.length > 25) {
		selectMenu.options.length = 25;
	}
	return new MessageActionRow().addComponents(selectMenu);
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

async function attachCharacter(sageCache: SageCache, channel: DMessageTarget, pathbuilderId: number, character: PathbuilderCharacter, pin: boolean): Promise<void> {
	const raw = resolveToEmbeds(sageCache, character.toHtml()).map(e => e.description).join("");
	const buffer = Buffer.from(raw, "utf-8");
	const attachment = new MessageAttachment(buffer, `pathbuilder2e-${pathbuilderId}.txt`);
	const message = await channel.send({
		content: `Attaching Pathbuilder2e Character: ${character.name} (${pathbuilderId})`,
		files:[attachment]
	}).catch(errorReturnNull);
	if (pin && message?.pinnable) {
		await message.pin();
	}
	return Promise.resolve();
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

async function postCharacter(sageCache: SageCache, channel: DMessageChannel, character: PathbuilderCharacter, pin: boolean): Promise<void> {
	setMacroUser(character, sageCache.user);
	const saved = await character.save();
	if (saved) {
		const output = prepareOutput(sageCache, character, sageCache.user);
		const message = await channel.send(output).catch(errorReturnNull);
		if (message) {
			character.messageId = message.id;
			await character.save();
			if (pin && message.pinnable) {
				await message.pin();
			}
			await notifyOfSlicedMacros(sageCache, character);
		}
	}else {
		const output = { embeds:resolveToEmbeds(sageCache, character.toHtml()) };
		const message = await channel.send(output).catch(errorReturnNull);
		if (pin && message?.pinnable) {
			await message.pin();
		}
	}
}

export async function updateSheet(sageCache: SageCache, character: PathbuilderCharacter, message?: Message) {
	if (message) {
		if (!character.messageId) {
			character.messageId = message.id;
			await character.save();
		}
	}else {
		if (character.messageId) {
			const discordKey = new DiscordKey(sageCache.server.did, undefined, undefined, character.messageId);
			message = await sageCache.discord.fetchMessage(discordKey) ?? undefined;
		}
	}
	if (message) {
		const macroUser = await sageCache.users.getById(character.getSheetValue("macroUserId"));
		const output = prepareOutput(sageCache, character, macroUser);
		await message.edit(output);
		await notifyOfSlicedMacros(sageCache, character);
	}
}

function getActiveSections(character: PathbuilderCharacter): TCharacterSectionType[] {
	const activeView = character.getSheetValue<TCharacterViewType>("activeView");
	const activeSections = character.getSheetValue<TCharacterSectionType[]>("activeSections");
	return getCharacterSections(activeView) ?? activeSections ?? getCharacterSections("Combat") ?? [];
}
function createViewSelectRow(character: PathbuilderCharacter): MessageActionRow {
	const selectMenu = new MessageSelectMenu();
	selectMenu.setCustomId(`PB2E|${character.id}|View`);
	selectMenu.setPlaceholder("Character Sheet Sections");
	selectMenu.setMinValues(1);

	const activeSections = getActiveSections(character);

	const validSectionTypes = character.getValidSections();
	validSectionTypes.sort();
	validSectionTypes.forEach(sectionType => {
		selectMenu.addOptions({
			label: sectionType,
			value: sectionType,
			default: activeSections.includes(sectionType)
		});
	});

	const validViewTypes = character.getValidViews();
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


function createExplorationSelectRow(character: PathbuilderCharacter): MessageActionRow {
	const selectMenu = new MessageSelectMenu();
	selectMenu.setCustomId(`PB2E|${character.id}|Exploration`);
	selectMenu.setPlaceholder("Select Exploration Mode");

	const activeExploration = character.getSheetValue("activeExploration");
	const explorationModes = getExplorationModes();
	explorationModes.forEach(mode => {
		selectMenu.addOptions({
			label: `Exploration Mode: ${mode}`,
			value: mode,
			default: mode === activeExploration
		});
	});

	return createSelectMenuRow(selectMenu);
}

function createSkillSelectRow(character: PathbuilderCharacter): MessageActionRow {
	const selectMenu = new MessageSelectMenu();
	selectMenu.setCustomId(`PB2E|${character.id}|Skill`);
	selectMenu.setPlaceholder("Select a Skill to Roll");

	const activeSkill = character.getSheetValue("activeSkill");
	const lores = character.lores.map(lore => lore[0]);
	const saves = getSavingThrows<string>();
	const savesSkillsAndLores = saves.concat(getSkills(), lores).filter(isNotBlank).filter(toUnique);
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

const maxLength = 100;
function createMacroLabel(macro: TLabeledMacro): string {
	let prefix = macro.prefix;
	const name = macro.name;
	if (`${prefix}: ${name}`.length > maxLength) {
		if (macro.prefix === "Attack Roll") prefix = "Atk Roll";
	}
	if (`${prefix}: ${name}`.length > maxLength) {
		if (macro.prefix === "Attack Roll") prefix = "Attack";
		if (macro.prefix === "Macro Roll") prefix = "Macro";
	}
	if (`${prefix}: ${name}`.length > maxLength) {
		if (macro.prefix === "Attack Roll") prefix = "Atk";
	}
	if (`${prefix}: ${name}`.length > maxLength) {
		return `${prefix}: ${name}`.slice(0, 99) + "\u2026";
	}
	return `${prefix}: ${name}`;
}
function createMacroSelectRow(character: PathbuilderCharacter, macros: TLabeledMacro[]): MessageActionRow {
	const selectMenu = new MessageSelectMenu();
	selectMenu.setCustomId(`PB2E|${character.id}|Macro`);
	selectMenu.setPlaceholder("Select a Macro to Roll");

	const activeMacro = character.getSheetValue("activeMacro");
	macros.forEach(macro => {
		selectMenu.addOptions({
			label: createMacroLabel(macro),
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

function createButton(customId: string, label: string, style: MessageButtonStyleResolvable): MessageButton {
	const button = new MessageButton();
	button.setCustomId(customId);
	if (label.startsWith("<") && label.endsWith(">")) {
		button.setEmoji(label);
	}else {
		button.setLabel(label);
	}
	button.setStyle(style);
	return button;
}

function createRollButtonRow(character: PathbuilderCharacter, macros: TMacro[]): MessageActionRow {
	const rollButton = createButton(`PB2E|${character.id}|Roll`, `Roll Check`, "PRIMARY");
	const rollSecretButton = createButton(`PB2E|${character.id}|Secret`, `Roll Secret Check`, "PRIMARY");
	const rollInitButton = createButton(`PB2E|${character.id}|Init`, `Roll Initiative`, "PRIMARY");
	const macroButton = createButton(`PB2E|${character.id}|MacroRoll`, macros.length > 0 ? `Roll Macro` : `Load Macros`, "PRIMARY");
	const linkButton = character.characterId
		? createButton(`PB2E|${character.id}|Unlink`, "🔗", "DANGER")
		: createButton(`PB2E|${character.id}|Link`, "🔗", "SECONDARY");
	return new MessageActionRow().addComponents(rollButton, rollSecretButton, rollInitButton, macroButton, linkButton);
}

function createComponents(character: PathbuilderCharacter, macroUser: Optional<User>): MessageActionRow[] {
	const macros = getMacros(character, macroUser);
	return [
		createViewSelectRow(character),
		createExplorationSelectRow(character),
		createSkillSelectRow(character),
		macros.length > 0 ? createMacroSelectRow(character, macros) : undefined,
		createRollButtonRow(character, macros)
	].filter(isDefined);
}

type TOutput = { embeds:MessageEmbed[], components:MessageActionRow[] };
function prepareOutput(sageCache: SageCache, character: PathbuilderCharacter, macroUser: Optional<User>): TOutput {
	const embeds = resolveToEmbeds(sageCache, character.toHtml(getActiveSections(character)));
	const components = createComponents(character, macroUser);
	return { embeds, components };
}

//#region button command

type TActionIdType = ["PB2E", UUID, "View" | "Exploration" | "Skill" | "Macro" | "Roll" | "Secret" | "Init" | "MacroRoll" | "Link" | "Unlink"];

function matchesOldActionRegex(customId: string): boolean {
	const _uuidActionRegex = /^(?:PB2E\|)*(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\|(?:View|Exploration|Skill|Macro|Roll|Secret|Init|MacroRoll)$/i;
	return _uuidActionRegex.test(customId);
}

function matchesActionRegex(customId: string): boolean {
	const uuidActionRegex = /^(?:PB2E)\|(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\|(?:View|Exploration|Skill|Macro|Roll|Secret|Init|MacroRoll|Link|Unlink)$/i;
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

export function getValidPathbuilderCharacterId(customId?: string | null): string | undefined {
	if (!customId) {
		return undefined;
	}

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
		if (_pb2e === "PB2E" && PathbuilderCharacter.exists(characterId)) {
			return characterId;
		};
	}
	return undefined;
}

function sheetTester(sageInteraction: SageButtonInteraction): boolean {
	const customId = sageInteraction.interaction.customId;
	return getValidPathbuilderCharacterId(customId) !== undefined;
}

async function viewHandler(sageInteraction: SageSelectInteraction, character: PathbuilderCharacter): Promise<void> {
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
	await character.save();
	return updateSheet(sageInteraction.sageCache, character, sageInteraction.interaction.message as Message);
}

async function explorationHandler(sageInteraction: SageSelectInteraction, character: PathbuilderCharacter): Promise<void> {
	const activeExploration = sageInteraction.interaction.values[0];
	character.setSheetValue("activeExploration", activeExploration);
	await character.save();
	return updateSheet(sageInteraction.sageCache, character, sageInteraction.interaction.message as Message);
}

async function skillHandler(sageInteraction: SageSelectInteraction, character: PathbuilderCharacter): Promise<void> {
	const activeSkill = sageInteraction.interaction.values[0];
	character.setSheetValue("activeSkill", activeSkill);
	await character.save();
	return updateSheet(sageInteraction.sageCache, character, sageInteraction.interaction.message as Message);
}

async function macroHandler(sageInteraction: SageSelectInteraction, character: PathbuilderCharacter): Promise<void> {
	const activeMacro = sageInteraction.interaction.values[0];
	if (activeMacro === "REFRESH") {
		setMacroUser(character, sageInteraction.sageUser);
	}else {
		character.setSheetValue("activeMacro", activeMacro);
	}
	await character.save();
	return updateSheet(sageInteraction.sageCache, character, sageInteraction.interaction.message as Message);
}


async function rollHandler(sageInteraction: SageButtonInteraction, character: PathbuilderCharacter, secret = false, init = false): Promise<void> {
	const skill = init ? character.getInitSkill() : character.getSheetValue<string>("activeSkill") ?? "Perception";
	const skillMod = character.getProficiencyAndMod(skill)[1];
	const incredibleMod = character.hasFeat("Incredible Initiative") ? 2 : 0;
	const scoutMod = character.getSheetValue("activeExploration") === "Scout" ? 1 : 0;
	const initMod = init ? Math.max(incredibleMod, scoutMod) : 0;
	const dice = `[1d20+${skillMod+initMod} ${character.name}${secret ? " Secret" : ""} ${skill}${init ? " (Initiative)" : ""}]`;
	const matches = await parseDiceMatches(sageInteraction, dice);
	const output = matches.map(match => match.output).flat();
	const sendResults = await sendDice(sageInteraction, output);
	if (sendResults.allSecret && sendResults.hasGmChannel) {
		await sageInteraction.interaction.channel?.send({
			content: `${toUserMention(sageInteraction.user.id)} *Secret Dice sent to the GM* 🎲`,
			components: createMessageDeleteButtonComponents(sageInteraction.user.id)
		});
	}
}

async function macroRollHandler(sageInteraction: SageButtonInteraction, character: PathbuilderCharacter): Promise<void> {
	const macroUser = await sageInteraction.sageCache.users.getById(character.getSheetValue("macroUserId"));
	const activeMacro = character.getSheetValue("activeMacro");
	const macros = getMacros(character, macroUser);
	// check by id first (proper) then by name second (fallback to old renders)
	const macro = macros.find(m => m.id === activeMacro) ?? macros.find(m => m.name === activeMacro);
	if (macro) {
		const matches = await parseDiceMatches(sageInteraction, macro.dice.replace(/\{.*?\}/g, match => match.slice(1,-1).split(":")[1] ?? ""));
		const output = matches.map(match => match.output).flat();
		await sendDice(sageInteraction, output);
	}else {
		setMacroUser(character, sageInteraction.sageUser);
		await character.save();
		await updateSheet(sageInteraction.sageCache, character, sageInteraction.interaction.message as Message);
		if (macros.length) {
			sageInteraction.send("Invalid Macro!");
		}
	}
}

async function linkHandler(sageInteraction: SageButtonInteraction, character: PathbuilderCharacter): Promise<void> {
	const { game, isPlayer, isGameMaster, sageUser } = sageInteraction;
	if (game && !(isPlayer || isGameMaster)) {
		return sageInteraction.reply("You aren't part of this game.", true);
	}

	const name = character.name;
	const pcs = game?.playerCharacters ?? sageUser.playerCharacters;
	const npcs = game?.nonPlayerCharacters ?? sageUser.nonPlayerCharacters;
	const char = pcs.findByName(name) ?? pcs.findCompanionByName(name)
		?? npcs.findByName(name) ?? npcs.findCompanionByName(name);

	if (char) {
		character.characterId = char.id;
		character.messageId = sageInteraction.interaction.message.id;
		character.userDid = char.userDid;
		char.pathbuilderId = character.id;
		const charSaved = await character.save();
		const gameSaved = charSaved ? await (game ?? sageUser).save() : false;
		if (gameSaved) {
			await updateSheet(sageInteraction.sageCache, character, sageInteraction.interaction.message as Message);
			return sageInteraction.reply("Character Successfully Linked.", true);
		}else {
			return sageInteraction.reply("Sorry, unable to link character.", true);
		}
	}else {
		return sageInteraction.reply("No character to link to.", true);
	}
}

async function unlinkHandler(sageInteraction: SageButtonInteraction, character: PathbuilderCharacter): Promise<void> {
	const { game, isGameMaster, sageUser } = sageInteraction;
	const isUser = character.userDid === sageInteraction.sageUser.did;

	if (game && !isUser && !isGameMaster) {
		return sageInteraction.reply("You aren't part of this game.", true);
	}

	const pcs = game?.playerCharacters ?? sageUser.playerCharacters;
	const npcs = game?.nonPlayerCharacters ?? sageUser.nonPlayerCharacters;
	const char = pcs.findById(character.characterId) ?? npcs.findById(character.characterId);

	if (char) {
		character.characterId = null;
		character.messageId = sageInteraction.interaction.message.id;
		character.userDid = null;
		char.pathbuilderId = null;
		const charSaved = await character.save();
		const gameSaved = charSaved ? await (game ?? sageUser).save() : false;
		if (gameSaved) {
			await updateSheet(sageInteraction.sageCache, character, sageInteraction.interaction.message as Message);
			return sageInteraction.reply("Character Successfully Unlinked.", true);
		}else {
			return sageInteraction.reply("Sorry, unable to unlink character.", true);
		}
	}else {
		return sageInteraction.reply("No character to unlink.", true);
	}
}

async function sheetHandler(sageInteraction: SageInteraction): Promise<void> {
	await sageInteraction.interaction.deferUpdate();
	const customId = sageInteraction.interaction.customId;
	const [_PB2E, characterId, command] = parseCustomId(customId);
	const character = await PathbuilderCharacter.loadCharacter(characterId);
	if (character) {

		// if we matched the old regex, force the sheet to update
		if (!matchesActionRegex(customId)) {
			await updateSheet(sageInteraction.sageCache, character, sageInteraction.interaction.message as Message);
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
			case "Link": return linkHandler(sageInteraction, character);
			case "Unlink": return unlinkHandler(sageInteraction, character);
		}
	}
	return Promise.resolve();
}

//#endregion

//#region slash command

export async function handlePathbuilder2eImport(sageCommand: SageCommand): Promise<void> {
	const pathbuilderId = sageCommand.args.getNumber("id") ?? 0;
	await sageCommand.reply(`Fetching Pathbuilder 2e character using 'Export JSON' id: ${pathbuilderId}`, false);

	const pathbuilderChar = await PathbuilderCharacter.fetch(pathbuilderId, { });
	if (!pathbuilderChar) {
		return sageCommand.reply(`Failed to fetch Pathbuilder 2e character using 'Export JSON' id: ${pathbuilderId}!`, false);
	}

	const channel = sageCommand.dChannel as DMessageChannel;
	const user = channel ? undefined : await sageCommand.sageCache.discord.fetchUser(sageCommand.sageUser.did);

	const pin = sageCommand.args.getBoolean("pin") ?? false;
	const attach = sageCommand.args.getBoolean("attach") ?? false;
	if (attach) {
		await attachCharacter(sageCommand.sageCache, channel ?? user, pathbuilderId, pathbuilderChar, pin);
	}else {
		await postCharacter(sageCommand.sageCache, channel ?? user, pathbuilderChar, pin);
	}

	if (sageCommand.isSageInteraction()) {
		await sageCommand.deleteReply();
	}
}

//#endregion

//#region reimport

async function handleReimportError(sageCommand: SageMessage, errorMessage: string): Promise<void> {
	const content = [
		`Reimport Error!`,
		`> ` + errorMessage,
		`To reimport, please reply to your imported character sheet with:`,
		"```sage!reimport id=\"\"```",
		`If your updated charater has a new name, please include it:`,
		"```sage!reimport id=\"\" name=\"\"```",
		`***id** is the "Export JSON" id*`,
	];
	return sageCommand.whisper(content.join("\n"));
}

export async function handlePathbuilder2eReimport(sageCommand: SageMessage, message: Message, characterId: string): Promise<void> {
	const pathbuilderId = sageCommand.args.getNumber("id") ?? undefined;
	const updatedName = sageCommand.args.getString("name") ?? undefined;
	const refreshResult = await PathbuilderCharacter.refresh(characterId, pathbuilderId, updatedName);
	switch (refreshResult) {
		case "INVALID_CHARACTER_ID": return handleReimportError(sageCommand, "Unable to find an imported character to update.");
		case "MISSING_JSON_ID": return handleReimportError(sageCommand, "You are missing a 'Export JSON' id.");
		case "INVALID_JSON_ID": return handleReimportError(sageCommand, "Unable to fetch the 'Export JSON' id.");
		case "INVALID_CHARACTER_NAME": return handleReimportError(sageCommand, "The character names do not match!");
		case false: return sageCommand.whisper("Sorry, we don't know what happened!");
		default: {
			const char = await PathbuilderCharacter.loadCharacter(characterId);
			await updateSheet(sageCommand.sageCache, char!, message);
			await sageCommand.message.delete();
			return;
		}
	}
}

//#endregion

export function registerPathbuilder(): void {
	registerInteractionListener(sheetTester, sheetHandler);

}

