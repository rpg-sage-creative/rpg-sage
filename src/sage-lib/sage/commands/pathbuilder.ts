import { toUnique } from "@rsc-utils/array-utils";
import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import { errorReturnNull, isDefined } from "@rsc-utils/core-utils";
import { DiscordMaxValues, EmbedBuilder, parseReference, toUserMention, type MessageTarget } from "@rsc-utils/discord-utils";
import { isNotBlank, StringMatcher } from "@rsc-utils/string-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, StringSelectMenuBuilder, type ButtonInteraction, type StringSelectMenuInteraction } from "discord.js";
import { getExplorationModes, getSavingThrows, getSkills } from "../../../sage-pf2e/index.js";
import { getCharacterSections, PathbuilderCharacter, type TCharacterSectionType, type TCharacterViewType } from "../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { registerInteractionListener } from "../../discord/handlers.js";
import { resolveToEmbeds } from "../../discord/resolvers/resolveToEmbeds.js";
import type { SageCache } from "../model/SageCache.js";
import type { SageCommand } from "../model/SageCommand.js";
import type { SageInteraction } from "../model/SageInteraction.js";
import type { User } from "../model/User.js";
import type { TMacro } from "../model/types.js";
import { createMessageDeleteButtonComponents } from "../model/utils/deleteButton.js";
import { parseDiceMatches, sendDice } from "./dice.js";

type SageButtonInteraction = SageInteraction<ButtonInteraction>;
type SageSelectInteraction = SageInteraction<StringSelectMenuInteraction>;

function createActionRow<T extends ButtonBuilder | StringSelectMenuBuilder>(...components: T[]): ActionRowBuilder<T> {
	components.forEach(comp => {
		if ("options" in comp) {
			if (comp.options.length > 25) {
				comp.options.length = 25;
			}
			if (comp.data.min_values) {
				comp.setMaxValues(comp.options.length);
			}
		}
	});
	return new ActionRowBuilder<T>().setComponents(...components);
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

async function notifyOfSlicedMacros(sageCache: SageCache, character: PathbuilderCharacter): Promise<void> {
	const slicedMacros = character.getSheetValue<string[]>("slicedMacros") ?? [];
	if (slicedMacros.length) {
		const user = await sageCache.discord.fetchUser(sageCache.user.did);
		if (user) {
			await user.send({ content:`While importing ${character.name}, the combined list of attacks and custom macros exceeded the allowed number of options. The following macros were not displayed to avoid errors:\n> ${slicedMacros.join(", ")}` });
		}
	}
}

/** adds the character to the game for this channel ... creating the character if need be */
async function addOrUpdateCharacter(sageCommand: SageCommand, pbChar: PathbuilderCharacter, message: Message): Promise<boolean> {
	const { tokenUrl, avatarUrl } = sageCommand.isSageMessage()
		? sageCommand.args.getCharacterOptions({}) ?? { }
		: { } as { tokenUrl?:string; avatarUrl?:string; };

	// get or create character
	const owner = sageCommand.game ?? sageCommand.sageUser;
	const existing = owner.findCharacterOrCompanion(pbChar.name);
	const oChar = existing
		? ("game" in existing ? existing.game : existing)
		: await owner.playerCharacters.addCharacter({
			avatarUrl,
			id: pbChar.id as Snowflake,
			name: pbChar.name,
			pathbuilderId: pbChar.id,
			tokenUrl,
			userDid: pbChar.userId as Snowflake
		});

	// if something went wrong, fail out
	if (!oChar) return false;

	// link gamecharacter to pbcharacter
	pbChar.characterId = oChar.id;
	pbChar.setSheetRef(parseReference(message));
	pbChar.userId = oChar.userDid;
	const pbCharSaved = await pbChar.save();

	if (pbCharSaved) {
		await updateSheet(sageCommand, pbChar, message);
	}

	// newly created character should already be linked
	if (oChar.pathbuilderId === pbChar.id) {
		return pbCharSaved;
	}

	// link pbcharacter to gamecharacter
	oChar.pathbuilderId = pbChar.id;
	// optionally update images
	if (avatarUrl) oChar.avatarUrl = avatarUrl;
	if (tokenUrl) oChar.tokenUrl = tokenUrl;
	const oCharSaved = pbCharSaved ? await owner.save() : false;

	return oCharSaved;
}

/** posts the imported character to the channel */
export async function postCharacter(sageCommand: SageCommand, channel: Optional<MessageTarget>, character: PathbuilderCharacter, pin: boolean): Promise<void> {
	const { sageCache } = sageCommand;
	setMacroUser(character, sageCache.user);
	const saved = await character.save();
	if (saved) {
		const output = prepareOutput(sageCache, character, sageCache.user);
		const message = await channel?.send(output).catch(errorReturnNull);
		if (message) {
			await addOrUpdateCharacter(sageCommand, character, message);
			if (pin && message.pinnable) {
				await message.pin();
			}
		}
	}else {
		const output = { embeds:resolveToEmbeds(sageCache, character.toHtml()) };
		const message = await channel?.send(output).catch(errorReturnNull);
		if (pin && message?.pinnable) {
			await message.pin();
		}
	}
}

export async function updateSheet({ sageCache }: SageCommand, character: PathbuilderCharacter, message?: Message) {
	if (message) {
		// we have a message, update the sheet reference just in case
		if (character.setSheetRef(parseReference(message))) {
			// if it was updated, save the character
			await character.save();
		}

	}else {
		// we don't have a message, go find it
		if (character.hasSheetRef) {
			const messageReference = character.sheetRef;
			// handle old data before we stored the full MessageReference
			if (messageReference?.channelId) {
				message = await sageCache.fetchMessage(messageReference);
			}
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

function createViewSelectRow(character: PathbuilderCharacter): ActionRowBuilder<StringSelectMenuBuilder> {
	const selectMenu = new StringSelectMenuBuilder();
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

	return createActionRow(selectMenu);
}

function createExplorationSelectRow(character: PathbuilderCharacter): ActionRowBuilder<StringSelectMenuBuilder> {
	const selectMenu = new StringSelectMenuBuilder();
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

	return createActionRow(selectMenu);
}

function createSkillSelectRow(character: PathbuilderCharacter): ActionRowBuilder<StringSelectMenuBuilder> {
	const selectMenu = new StringSelectMenuBuilder();
	selectMenu.setCustomId(`PB2E|${character.id}|Skill`);
	selectMenu.setPlaceholder("Select a Skill to Roll");

	const activeSkill = character.getSheetValue("activeSkill");
	let saves = getSavingThrows<string>();
	let skills = getSkills();
	let lores = character.lores.map(lore => lore[0]).filter(isNotBlank).filter(toUnique);
	let savesSkillsAndLores = saves.concat(skills, lores).filter(toUnique);
	while (savesSkillsAndLores.length >= DiscordMaxValues.command.option.count) {
		let minProf = Math.min(
			character.lores.reduce((min, lore) => Math.min(min, lore[1]), 10),
			skills.reduce((min, skill) => Math.min(min, character.getProficiencyMod(skill as any)), 10)
		);
		const loreToRemove = lores.find(lore => character.lores.find(pair => pair[0] === lore && pair[1] <= minProf));
		if (loreToRemove) {
			lores = lores.filter(lore => lore !== loreToRemove);
			savesSkillsAndLores = saves.concat(skills, lores).filter(toUnique);
			continue;
		}
		const skillToRemove = skills.find(skill => character.getProficiencyMod(skill as any) <= minProf);
		if (skillToRemove) {
			skills = skills.filter(skill => skill !== skillToRemove);
			savesSkillsAndLores = saves.concat(skills, lores).filter(toUnique);
			continue;
		}
		if (lores.length) {
			lores.pop();
			savesSkillsAndLores = saves.concat(skills, lores).filter(toUnique);
			continue;
		}
		if (skills.length) {
			skills.pop();
			savesSkillsAndLores = saves.concat(skills, lores).filter(toUnique);
			continue;
		}
	}
	savesSkillsAndLores.forEach(skill => {
		const labelPrefix = saves.includes(skill) ? "Save" : "Skill";
		const skillCheck = character.createCheck(skill);
		selectMenu.addOptions({
			label: `${labelPrefix} Roll: ${skill}${lores.includes(skill) ? " Lore" : ""} ${skillCheck?.toModifier()} (${skillCheck?.proficiencyModifier?.proficiency})`,
			value: skill,
			default: skill === activeSkill || (!activeSkill && skill === "Perception")
		});
	});

	return createActionRow(selectMenu);
}

function createMacroLabel(macro: TLabeledMacro): string {
	const { labelLength } = DiscordMaxValues.component.select;
	let prefix = macro.prefix;
	const name = macro.name;
	if (`${prefix}: ${name}`.length > labelLength) {
		if (macro.prefix === "Attack Roll") prefix = "Atk Roll"; //NOSONAR
	}
	if (`${prefix}: ${name}`.length > labelLength) {
		if (macro.prefix === "Attack Roll") prefix = "Attack"; //NOSONAR
		if (macro.prefix === "Macro Roll") prefix = "Macro"; //NOSONAR
	}
	if (`${prefix}: ${name}`.length > labelLength) {
		if (macro.prefix === "Attack Roll") prefix = "Atk"; //NOSONAR
	}
	if (`${prefix}: ${name}`.length > labelLength) {
		return `${prefix}: ${name}`.slice(0, labelLength - 1) + "\u2026";
	}
	return `${prefix}: ${name}`;
}

function createMacroSelectRow(character: PathbuilderCharacter, macros: TLabeledMacro[]): ActionRowBuilder<StringSelectMenuBuilder> {
	const selectMenu = new StringSelectMenuBuilder();
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

	return createActionRow(selectMenu);
}

function createButton(customId: string, label: string, style: ButtonStyle): ButtonBuilder {
	const button = new ButtonBuilder();
	button.setCustomId(customId);
	if (label.startsWith("<") && label.endsWith(">")) {
		button.setEmoji(label);
	}else {
		button.setLabel(label);
	}
	button.setStyle(style);
	return button;
}

function createRollButtonRow(character: PathbuilderCharacter, macros: TMacro[]): ActionRowBuilder<ButtonBuilder> {
	const rollButton = createButton(`PB2E|${character.id}|Roll`, `Roll Check`, ButtonStyle.Primary);
	const rollSecretButton = createButton(`PB2E|${character.id}|Secret`, `Roll Secret Check`, ButtonStyle.Primary);
	const rollInitButton = createButton(`PB2E|${character.id}|Init`, `Roll Initiative`, ButtonStyle.Primary);
	const macroButton = createButton(`PB2E|${character.id}|MacroRoll`, macros.length > 0 ? `Roll Macro` : `Load Macros`, ButtonStyle.Primary);
	const linkButton = character.characterId
		? createButton(`PB2E|${character.id}|Unlink`, "🔗", ButtonStyle.Danger)
		: createButton(`PB2E|${character.id}|Link`, "🔗", ButtonStyle.Secondary);
	return new ActionRowBuilder<ButtonBuilder>().setComponents(rollButton, rollSecretButton, rollInitButton, macroButton, linkButton);
}

function createComponents(character: PathbuilderCharacter, macroUser: Optional<User>): ActionRowBuilder<ButtonBuilder|StringSelectMenuBuilder>[] {
	const macros = getMacros(character, macroUser);
	return [
		createViewSelectRow(character),
		createExplorationSelectRow(character),
		createSkillSelectRow(character),
		macros.length > 0 ? createMacroSelectRow(character, macros) : undefined,
		createRollButtonRow(character, macros)
	].filter(isDefined);
}

type TOutput = { embeds:EmbedBuilder[], components:ActionRowBuilder<ButtonBuilder|StringSelectMenuBuilder>[] };
function prepareOutput(sageCache: SageCache, character: PathbuilderCharacter, macroUser: Optional<User>): TOutput {
	const embeds = resolveToEmbeds(sageCache, character.toHtml(getActiveSections(character)));
	const components = createComponents(character, macroUser);
	return { embeds, components };
}

//#region button command

type TActionIdType = ["PB2E", string, "View" | "Exploration" | "Skill" | "Macro" | "Roll" | "Secret" | "Init" | "MacroRoll" | "Link" | "Unlink"];

function matchesOldActionRegex(customId: string): boolean {
	const actionRegex = /^(?:PB2E\|)*(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|\d{16,})\|(?:View|Exploration|Skill|Macro|Roll|Secret|Init|MacroRoll)$/i;
	return actionRegex.test(customId);
}

function matchesActionRegex(customId: string): boolean {
	const actionRegex = /^(?:PB2E)\|(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|\d{16,})\|(?:View|Exploration|Skill|Macro|Roll|Secret|Init|MacroRoll|Link|Unlink)$/i;
	return actionRegex.test(customId);
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
	return updateSheet(sageInteraction, character, sageInteraction.interaction.message);
}

async function explorationHandler(sageInteraction: SageSelectInteraction, character: PathbuilderCharacter): Promise<void> {
	const activeExploration = sageInteraction.interaction.values[0];
	character.setSheetValue("activeExploration", activeExploration);
	await character.save();
	return updateSheet(sageInteraction, character, sageInteraction.interaction.message);
}

async function skillHandler(sageInteraction: SageSelectInteraction, character: PathbuilderCharacter): Promise<void> {
	const activeSkill = sageInteraction.interaction.values[0];
	character.setSheetValue("activeSkill", activeSkill);
	await character.save();
	return updateSheet(sageInteraction, character, sageInteraction.interaction.message);
}

async function macroHandler(sageInteraction: SageSelectInteraction, character: PathbuilderCharacter): Promise<void> {
	const activeMacro = sageInteraction.interaction.values[0];
	if (activeMacro === "REFRESH") {
		setMacroUser(character, sageInteraction.sageUser);
	}else {
		character.setSheetValue("activeMacro", activeMacro);
	}
	await character.save();
	return updateSheet(sageInteraction, character, sageInteraction.interaction.message);
}


async function rollHandler(sageInteraction: SageButtonInteraction, character: PathbuilderCharacter, secret = false, init = false): Promise<void> {
	const skill = init ? character.getInitSkill() : character.getSheetValue("activeSkill") ?? "Perception";
	const skillMod = character.createCheck(skill)?.modifier ?? character.untrainedProficiencyMod;
	const incredibleMod = character.hasFeat("Incredible Initiative") ? 2 : 0;
	const scoutMod = character.getSheetValue("activeExploration") === "Scout" ? 1 : 0;
	const initMod = init ? Math.max(incredibleMod, scoutMod) : 0;
	const dice = `[1d20+${skillMod+initMod} ${character.name}${secret ? " Secret" : ""} ${skill}${init ? " (Initiative)" : ""}]`;
	const matches = await parseDiceMatches(sageInteraction, dice);
	const output = matches.map(match => match.output).flat();
	const sendResults = await sendDice(sageInteraction, output);
	if (sendResults.allSecret && sendResults.hasGmChannel) {
		await sageInteraction.interaction.channel?.send({
			content: `${toUserMention(sageInteraction.user.id as Snowflake)} *Secret Dice sent to the GM* 🎲`,
			components: createMessageDeleteButtonComponents(sageInteraction.user.id as Snowflake)
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
		await updateSheet(sageInteraction, character, sageInteraction.interaction.message);
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
		character.setSheetRef(parseReference(sageInteraction.interaction.message));
		character.userId = char.userDid;
		char.pathbuilderId = character.id;
		const charSaved = await character.save();
		const gameSaved = charSaved ? await (game ?? sageUser).save() : false;
		if (gameSaved) {
			await updateSheet(sageInteraction, character, sageInteraction.interaction.message);
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
	const isUser = character.userId === sageInteraction.sageUser.did;

	if (game && !isUser && !isGameMaster) {
		return sageInteraction.reply("You aren't part of this game.", true);
	}

	const pcs = game?.playerCharacters ?? sageUser.playerCharacters;
	const npcs = game?.nonPlayerCharacters ?? sageUser.nonPlayerCharacters;
	const char = pcs.findById(character.characterId) ?? npcs.findById(character.characterId);

	if (char) {
		character.characterId = null;
		character.setSheetRef(parseReference(sageInteraction.interaction.message));
		character.userId = null;
		char.pathbuilderId = null;
		const charSaved = await character.save();
		const gameSaved = charSaved ? await (game ?? sageUser).save() : false;
		if (gameSaved) {
			await updateSheet(sageInteraction, character, sageInteraction.interaction.message);
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
			await updateSheet(sageInteraction, character, sageInteraction.interaction.message);
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

export function registerPathbuilder(): void {
	registerInteractionListener(sheetTester, sheetHandler);

}

