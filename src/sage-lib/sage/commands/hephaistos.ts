import { errorReturnUndefined, isDefined, toUnique, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordMaxValues, EmbedBuilder, parseReference, toUserMention, type MessageTarget } from "@rsc-utils/discord-utils";
import { isNotBlank, StringMatcher } from "@rsc-utils/string-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, StringSelectMenuBuilder, type ButtonInteraction, type StringSelectMenuInteraction } from "discord.js";
import { HephaistosCharacterSF1e, type CharacterSectionType, type CharacterViewType } from "../../../gameSystems/sf1e/characters/HephaistosCharacter.js";
import { registerInteractionListener } from "../../discord/handlers.js";
import type { GameCharacter } from "../model/GameCharacter.js";
import type { DiceMacroBase, MacroBase } from "../model/Macro.js";
import { MacroOwner } from "../model/MacroOwner.js";
import { Macros } from "../model/Macros.js";
import type { SageCommand } from "../model/SageCommand.js";
import type { SageInteraction } from "../model/SageInteraction.js";
import type { User } from "../model/User.js";
import { createMessageDeleteButtonComponents } from "../model/utils/deleteButton.js";
import { parseDiceMatches, sendDice } from "./dice.js";
import { StatMacroProcessor } from "./dice/stats/StatMacroProcessor.js";
import { SavingThrow } from "../../../gameSystems/d20/lib/SavingThrow.js";
import { Skill } from "../../../gameSystems/sf1e/lib/Skill.js";

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

type TLabeledMacro = DiceMacroBase & { id:string; prefix:string; };
function getAttackMacros(character: HephaistosCharacterSF1e): TLabeledMacro[] {
	return character.getSheetMacros("attack")
		.map((macro, index) => ({ id:`atk-${index}`, prefix:"Attack Roll", ...macro }));
}

/** @todo you know what this is for ... */
function getSpellMacros(character: HephaistosCharacterSF1e): TLabeledMacro[] {
	return character.getSheetMacros("spell")
		.map((macro, index) => ({ id:`spl-${index}`, prefix:"Spell Roll", ...macro }));
}

async function getCharMacros(sageCommand: SageCommand, character: HephaistosCharacterSF1e): Promise<TLabeledMacro[]> {
	const char = findLinkedGameCharacter(sageCommand, character);
	const macroOwner = await MacroOwner.findByCharacter(sageCommand, char);
	const macros = await Macros.parse(sageCommand, macroOwner);
	if (macros) {
		return (macros.getCharSheetMacros() as DiceMacroBase[])
			.filter(macro => macro.dice)
			.map((macro, index) => ({ id:`chr-${index}`, prefix:"Macro Roll", ...macro }));
	}
	return [];
}

function getUserMacros(character: HephaistosCharacterSF1e, macroUser: Optional<User>): TLabeledMacro[] {
	if (macroUser) {
		const matcher = new StringMatcher(character.name);
		return (macroUser.macros as DiceMacroBase[])
			.filter(macro => matcher.matches(macro.category) && macro.dice)
			.map((macro, index) => ({ id:`usr-${index}`, prefix:"Macro Roll", ...macro }));
	}
	return [];
}

async function getMacros(sageCommand: SageCommand, character: HephaistosCharacterSF1e): Promise<TLabeledMacro[]> {
	// create attack rolls
	const attackMacros = getAttackMacros(character);

	// create spell rolls
	const spellMacros = getSpellMacros(character);

	// get user macros with character name as category (old logic)
	const macroUser = await sageCommand.sageCache.getOrFetchUser(character.getSheetValue("macroUserId"));
	const userMacros = getUserMacros(character, macroUser);

	// get character macros (new logic)
	const charMacros = await getCharMacros(sageCommand, character);

	const isTooMany = () => attackMacros.length + spellMacros.length + userMacros.length + charMacros.length > 24;

	const slicedMacros: TLabeledMacro[] = [];

	// Remove dynamically made attacks first
	while (attackMacros.length && isTooMany()) {
		slicedMacros.push(attackMacros.pop()!);
	}

	// Remove dynamically made spells second
	while (spellMacros.length && isTooMany()) {
		slicedMacros.push(spellMacros.pop()!);
	}

	// Remove their user macros next
	while (userMacros.length && isTooMany()) {
		slicedMacros.push(userMacros.pop()!);
	}

	// Remove their char macros last
	while (isTooMany()) {
		slicedMacros.push(charMacros.pop()!);
	}

	character.setSheetValue("slicedMacros", slicedMacros.map(macro => macro.name));

	return [
		...attackMacros,
		...spellMacros,
		...charMacros,
		...userMacros,
	];
}

function setMacroUser(character: HephaistosCharacterSF1e, macroUser: User): void {
	if (getUserMacros(character, macroUser).length > 0) {
		character.setSheetValue("macroUserId", macroUser.id);
	}else {
		character.setSheetValue("macroUserId", null);
	}
}

async function notifyOfSlicedMacros({ sageCache }: SageCommand, character: HephaistosCharacterSF1e): Promise<void> {
	const slicedMacros = character.getSheetValue<string[]>("slicedMacros") ?? [];
	if (slicedMacros.length) {
		const user = await sageCache.discord.fetchUser(sageCache.user.did);
		if (user) {
			await user.send({ content:`While importing ${character.name}, the combined list of attacks and custom macros exceeded the allowed number of options. The following macros were not displayed to avoid errors:\n> ${slicedMacros.join(", ")}` });
		}
	}
}

/** adds the character to the game for this channel ... creating the character if need be */
async function addOrUpdateCharacter(sageCommand: SageCommand, hChar: HephaistosCharacterSF1e, message: Message): Promise<boolean> {
	const { tokenUrl, avatarUrl } = sageCommand.isSageMessage()
		? sageCommand.args.getCharacterOptions({}) ?? { }
		: { } as { tokenUrl?:string; avatarUrl?:string; };

	// get or create character
	const owner = sageCommand.game ?? sageCommand.sageUser;
	const existing = owner.findCharacterOrCompanion(hChar.name);
	const oChar = existing
		? ("game" in existing ? existing.game : existing)
		: await owner.playerCharacters.addCharacter({
			avatarUrl,
			id: hChar.id as Snowflake,
			name: hChar.name,
			hephaistosId: hChar.id,
			tokenUrl,
			userDid: hChar.userId as Snowflake
		});

	// if something went wrong, fail out
	if (!oChar) return false;

	// link gamecharacter to hcharacter
	hChar.characterId = oChar.id;
	hChar.setSheetRef(parseReference(message));
	hChar.userId = oChar.userDid;
	const hCharSaved = await hChar.save();

	if (hCharSaved) {
		await updateSheet(sageCommand, hChar, message);
	}

	// newly created character should already be linked
	if (oChar.hephaistosId === hChar.id) {
		return hCharSaved;
	}

	// link hcharacter to gamecharacter
	oChar.hephaistosId = hChar.id;
	// optionally update images
	if (avatarUrl) oChar.avatarUrl = avatarUrl;
	if (tokenUrl) oChar.tokenUrl = tokenUrl;
	const oCharSaved = hCharSaved ? await owner.save() : false;

	return oCharSaved;
}

/** posts the imported character to the channel */
export async function postCharacter(sageCommand: SageCommand, channel: Optional<MessageTarget>, character: HephaistosCharacterSF1e, pin: boolean): Promise<void> {
	const { eventCache } = sageCommand;
	setMacroUser(character, eventCache.user);
	const saved = await character.save();
	if (saved) {
		const macros = await getMacros(sageCommand, character)
		const output = prepareOutput(sageCommand, character, macros);
		const message = await channel?.send(output).catch(errorReturnUndefined);
		if (message) {
			await addOrUpdateCharacter(sageCommand, character, message);
			if (pin && message.pinnable) {
				await message.pin();
			}
		}
	}else {
		const output = { embeds:eventCache.resolveToEmbeds(character.toHtml()) };
		const message = await channel?.send(output).catch(errorReturnUndefined);
		if (pin && message?.pinnable) {
			await message.pin();
		}
	}
}

export async function updateSheet(sageCommand: SageCommand, character: HephaistosCharacterSF1e, message?: Message) {
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
				message = await sageCommand.sageCache.fetchMessage(messageReference);
			}
		}
	}
	if (message) {
		const macros = await getMacros(sageCommand, character)
		const output = prepareOutput(sageCommand, character, macros);
		await message.edit(output);
		await notifyOfSlicedMacros(sageCommand, character);
	}
}

function getActiveSections(character: HephaistosCharacterSF1e): CharacterSectionType[] {
	const activeView = character.getSheetValue<CharacterViewType>("activeView");
	const activeSections = character.getSheetValue<CharacterSectionType[]>("activeSections");
	return HephaistosCharacterSF1e.getCharacterSections(activeView)
		?? activeSections
		?? HephaistosCharacterSF1e.getCharacterSections("Combat")
		?? [];
}

function createViewSelectRow(character: HephaistosCharacterSF1e): ActionRowBuilder<StringSelectMenuBuilder> {
	const selectMenu = new StringSelectMenuBuilder();
	selectMenu.setCustomId(`HEPH1E|${character.id}|View`);
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
		const sections = HephaistosCharacterSF1e.getCharacterSections(view) ?? [];
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

function createSkillSelectRow(character: HephaistosCharacterSF1e): ActionRowBuilder<StringSelectMenuBuilder> {
	const selectMenu = new StringSelectMenuBuilder();
	selectMenu.setCustomId(`HEPH1E|${character.id}|Skill`);
	selectMenu.setPlaceholder("Select a Skill to Roll");

	const activeSkill = character.getSheetValue("activeSkill");
	const charSkillsAndProfessions = character.toJSON().skills;
	const charSkills = charSkillsAndProfessions.filter(skill => skill.skill !== "Profession");
	const charProfessions = charSkillsAndProfessions.filter(skill => skill.skill === "Profession");
	let saves = SavingThrow.names() as string[];
	let skills = Skill.all({ includePerception:true }).map(skill => skill.name) as string[];
	let professions = charProfessions.map(({ name }) => name).filter(isNotBlank).filter(toUnique);
	let savesSkillsAndProfessions = saves.concat(skills, professions).filter(toUnique);
	while (savesSkillsAndProfessions.length >= DiscordMaxValues.command.option.count) {
		// WHAT THE F*CK IS THE 20 FOR? ... some sort of artificial cutoff? perhaps capping the prof ranks
		let minRanks = Math.min(
			charProfessions.reduce((min, skill) => Math.min(min, skill.ranks), 20),
			charSkills.reduce((min, skill) => Math.min(min, skill.ranks), 20)
		);
		const professionToRemove = professions.find(name => charProfessions.find(prof => name === prof.name && prof.ranks <= minRanks));
		if (professionToRemove) {
			professions = professions.filter(name => name !== professionToRemove);
			savesSkillsAndProfessions = saves.concat(skills, professions).filter(toUnique);
			continue;
		}
		const skillToRemove = skills.find(name => charSkills.find(skill => name === skill.name && skill.ranks <= minRanks));
		if (skillToRemove) {
			skills = skills.filter(name => name !== skillToRemove);
			savesSkillsAndProfessions = saves.concat(skills, professions).filter(toUnique);
			continue;
		}
		if (professions.length) {
			professions.pop();
			savesSkillsAndProfessions = saves.concat(skills, professions).filter(toUnique);
			continue;
		}
		if (skills.length) {
			skills.pop();
			savesSkillsAndProfessions = saves.concat(skills, professions).filter(toUnique);
			continue;
		}
	}
	savesSkillsAndProfessions.forEach(skill => {
		const labelPrefix = saves.includes(skill) ? "Save" : "Skill";
		const skillCheck = character.createCheck(skill);
		const profPrefix = professions.includes(skill) ? " Profession" : "";
		const trained = charSkillsAndProfessions.find(sk => sk.skill === skill || sk.skill === "Profession" && sk.name === skill)?.ranks ? " (trained)" : "";
		selectMenu.addOptions({
			label: `${labelPrefix} Roll: ${profPrefix}${skill} ${skillCheck?.toModifier()}${trained}`,
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
		if (macro.prefix === "Spell Roll") prefix = "Spl Roll"; //NOSONAR
	}
	if (`${prefix}: ${name}`.length > labelLength) {
		if (macro.prefix === "Attack Roll") prefix = "Attack"; //NOSONAR
		if (macro.prefix === "Macro Roll") prefix = "Macro"; //NOSONAR
		if (macro.prefix === "Spell Roll") prefix = "Spell"; //NOSONAR
	}
	if (`${prefix}: ${name}`.length > labelLength) {
		if (macro.prefix === "Attack Roll") prefix = "Atk"; //NOSONAR
		if (macro.prefix === "Spell Roll") prefix = "Spl"; //NOSONAR
	}
	if (`${prefix}: ${name}`.length > labelLength) {
		return `${prefix}: ${name}`.slice(0, labelLength - 1) + "\u2026";
	}
	return `${prefix}: ${name}`;
}

function createMacroSelectRow(character: HephaistosCharacterSF1e, macros: TLabeledMacro[]): ActionRowBuilder<StringSelectMenuBuilder> {
	const selectMenu = new StringSelectMenuBuilder();
	selectMenu.setCustomId(`HEPH1E|${character.id}|Macro`);
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

function createRollButtonRow(character: HephaistosCharacterSF1e, macros: MacroBase[]): ActionRowBuilder<ButtonBuilder> {
	const rollButton = createButton(`HEPH1E|${character.id}|Roll`, `Roll Check`, ButtonStyle.Primary);
	const rollSecretButton = createButton(`HEPH1E|${character.id}|Secret`, `Roll Secret Check`, ButtonStyle.Primary);
	const rollInitButton = createButton(`HEPH1E|${character.id}|Init`, `Roll Initiative`, ButtonStyle.Primary);
	const macroButton = createButton(`HEPH1E|${character.id}|MacroRoll`, macros.length > 0 ? `Roll Macro` : `Load Macros`, ButtonStyle.Primary);
	const linkButton = character.characterId
		? createButton(`HEPH1E|${character.id}|Unlink`, "🔗", ButtonStyle.Danger)
		: createButton(`HEPH1E|${character.id}|Link`, "🔗", ButtonStyle.Secondary);
	return new ActionRowBuilder<ButtonBuilder>().setComponents(rollButton, rollSecretButton, rollInitButton, macroButton, linkButton);
}

function createComponents(character: HephaistosCharacterSF1e, macros: TLabeledMacro[]): ActionRowBuilder<ButtonBuilder|StringSelectMenuBuilder>[] {
	return [
		createViewSelectRow(character),
		createSkillSelectRow(character),
		macros.length > 0 ? createMacroSelectRow(character, macros) : undefined,
		createRollButtonRow(character, macros)
	].filter(isDefined);
}

type TOutput = { embeds:EmbedBuilder[], components:ActionRowBuilder<ButtonBuilder|StringSelectMenuBuilder>[] };
function prepareOutput({ eventCache }: SageCommand, character: HephaistosCharacterSF1e, macros: TLabeledMacro[]): TOutput {
	const embeds = eventCache.resolveToEmbeds(character.toHtml(getActiveSections(character)));
	const components = createComponents(character, macros);
	return { embeds, components };
}

//#region button command

export function getValidHephaistosCharacterSF1eId(customId?: string | null): string | undefined {
	const actionRegex = /^HEPH1E\|(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|\d{16,})\|(?:View|Skill|Macro|Roll|Secret|Init|MacroRoll|Link|Unlink)$/i;
	if (!customId || !actionRegex.test(customId)) {
		return undefined;
	}

	const [_heph1e, characterId] = customId.split("|");
	if (_heph1e === "HEPH1E" && HephaistosCharacterSF1e.exists(characterId)) {
		return characterId;
	}
	return undefined;
}

function sheetTester(sageInteraction: SageButtonInteraction): boolean {
	const customId = sageInteraction.interaction.customId;
	return getValidHephaistosCharacterSF1eId(customId) !== undefined;
}

async function viewHandler(sageInteraction: SageSelectInteraction, character: HephaistosCharacterSF1e): Promise<void> {
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

async function skillHandler(sageInteraction: SageSelectInteraction, character: HephaistosCharacterSF1e): Promise<void> {
	const activeSkill = sageInteraction.interaction.values[0];
	character.setSheetValue("activeSkill", activeSkill);
	await character.save();
	return updateSheet(sageInteraction, character, sageInteraction.interaction.message);
}

async function macroHandler(sageInteraction: SageSelectInteraction, character: HephaistosCharacterSF1e): Promise<void> {
	const activeMacro = sageInteraction.interaction.values[0];
	if (activeMacro === "REFRESH") {
		setMacroUser(character, sageInteraction.sageUser);
	}else {
		character.setSheetValue("activeMacro", activeMacro);
	}
	await character.save();
	return updateSheet(sageInteraction, character, sageInteraction.interaction.message);
}


async function rollHandler(sageInteraction: SageButtonInteraction, character: HephaistosCharacterSF1e, secret = false, init = false): Promise<void> {
	const skill = init ? "Perception" : character.getSheetValue("activeSkill") ?? "Perception";
	const skillMod = character.createCheck(skill)?.modifier ?? 0;
	const incredibleMod = 0; //character.hasFeat("Incredible Initiative") ? 2 : 0;
	const dice = `[1d20+${skillMod+incredibleMod} ${character.name}${secret ? " Secret" : ""} ${skill}${init ? " (Initiative)" : ""}]`;
	const processor = StatMacroProcessor.withMacros(sageInteraction).for(sageInteraction.findCharacter(character.characterId));
	const matches = await parseDiceMatches(dice, { processor, sageCommand:sageInteraction });
	const output = matches.map(match => match.output).flat();
	const sendResults = await sendDice(sageInteraction, output);
	if (sendResults.allSecret && sendResults.hasGmChannel) {
		await sageInteraction.interactionChannel?.send({
			content: `${toUserMention(sageInteraction.user.id as Snowflake)} *Secret Dice sent to the GM* 🎲`,
			components: createMessageDeleteButtonComponents(sageInteraction.user.id as Snowflake)
		});
	}
}

async function macroRollHandler(sageInteraction: SageButtonInteraction, character: HephaistosCharacterSF1e): Promise<void> {
	// get selectable macro list
	const macros = await getMacros(sageInteraction, character);

	// get selected macro
	const activeMacro = character.getSheetValue("activeMacro");

	// check by id first (proper) then by name second (fallback to old renders)
	const macro = macros.find(m => m.id === activeMacro) ?? macros.find(m => m.name === activeMacro);

	if (macro) {
		const dice = macro.dice.replace(/\{.*?\}/g, match => match.slice(1,-1).split(":")[1] ?? "");
		const processor = StatMacroProcessor.withMacros(sageInteraction).for(sageInteraction.findCharacter(character.characterId));
		const matches = await parseDiceMatches(dice, { processor, sageCommand:sageInteraction });
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

async function linkHandler(sageInteraction: SageButtonInteraction, character: HephaistosCharacterSF1e): Promise<void> {
	const { game, isPlayer, isGameMaster, sageUser } = sageInteraction;
	if (game && !(isPlayer || isGameMaster)) {
		return sageInteraction.reply("You aren't part of this game.", true);
	}

	const char = findUnlinkedGameCharacter(sageInteraction, character);

	if (char) {
		character.characterId = char.id;
		character.setSheetRef(parseReference(sageInteraction.interaction.message));
		character.userId = char.userDid;
		char.hephaistosId = character.id;
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

function findUnlinkedGameCharacter({ game, sageUser }: SageCommand, { name }: HephaistosCharacterSF1e): GameCharacter | undefined {
	const pcs = game?.playerCharacters ?? sageUser.playerCharacters;
	const npcs = game?.nonPlayerCharacters ?? sageUser.nonPlayerCharacters;
	return pcs.findByName(name)
		?? pcs.findCompanionByName(name)
		?? npcs.findByName(name)
		?? npcs.findCompanionByName(name);
}

function findLinkedGameCharacter({ game, sageUser }: SageCommand, { characterId }: HephaistosCharacterSF1e): GameCharacter | undefined {
	const pcs = game?.playerCharacters ?? sageUser.playerCharacters;
	const npcs = game?.nonPlayerCharacters ?? sageUser.nonPlayerCharacters;
	return pcs.findById(characterId)
		?? npcs.findById(characterId);
}

async function unlinkHandler(sageInteraction: SageButtonInteraction, character: HephaistosCharacterSF1e): Promise<void> {
	const { game, isGameMaster, sageUser } = sageInteraction;
	const isUser = character.userId === sageInteraction.sageUser.did;

	if (game && !isUser && !isGameMaster) {
		return sageInteraction.reply("You aren't part of this game.", true);
	}

	const char = findLinkedGameCharacter(sageInteraction, character);

	if (char) {
		character.characterId = null;
		character.setSheetRef(parseReference(sageInteraction.interaction.message));
		character.userId = null;
		char.hephaistosId = null;
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
	const [_HEPH1E, characterId, command] = sageInteraction.interaction.customId.split("|");
	const character = await HephaistosCharacterSF1e.loadCharacter(characterId);
	if (character) {
		switch(command) {
			case "View": return viewHandler(sageInteraction, character);
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

export function registerHephaistos(): void {
	registerInteractionListener(sheetTester, sheetHandler);

}

