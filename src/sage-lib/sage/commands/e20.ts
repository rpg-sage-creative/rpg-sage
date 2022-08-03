import { ButtonInteraction, Message, MessageActionRow, MessageAttachment, MessageButton, MessageButtonStyleResolvable, MessageEmbed, MessageSelectMenu, SelectMenuInteraction } from "discord.js";
import { toMod } from "../../../sage-dice";
import { PdfJsonFields, TRawJson } from "../../../sage-e20/common/pdf";
import { PdfJsonParserJoe } from "../../../sage-e20/joe/parse";
import PlayerCharacterJoe, { PlayerCharacterCoreJoe } from "../../../sage-e20/joe/PlayerCharacterJoe";
import { PdfJsonParserPR } from "../../../sage-e20/pr/parse";
import PlayerCharacterPR, { getCharacterSections, PlayerCharacterCorePR, TCharacterSectionType, TCharacterViewType } from "../../../sage-e20/pr/PlayerCharacterPR";
import type { UUID } from "../../../sage-utils";
import { errorReturnFalse, errorReturnNull } from "../../../sage-utils/utils/ConsoleUtils/Catchers";
import { readJsonFile, writeFile } from "../../../sage-utils/utils/FsUtils";
import { PdfCacher } from "../../../sage-utils/utils/PdfUtils";
import { DiscordId, DUser, TChannel } from "../../discord";
import { resolveToEmbeds } from "../../discord/embeds";
import { registerInteractionListener } from "../../discord/handlers";
import type SageCache from "../model/SageCache";
import type SageInteraction from "../model/SageInteraction";
import { parseDiceMatches, sendDice } from "./dice";

type TPlayerCharacter = PlayerCharacterJoe | PlayerCharacterPR;
type TPlayerCharacterCore = PlayerCharacterCoreJoe | PlayerCharacterCorePR;

async function attachCharacter(sageCache: SageCache, channel: TChannel | DUser, attachmentName: string, character: TPlayerCharacter, pin: boolean): Promise<void> {
	const raw = resolveToEmbeds(sageCache, character.toHtml()).map(e => e.description).join("");
	const buffer = Buffer.from(raw, "utf-8");
	const attachment = new MessageAttachment(buffer, `${attachmentName}.txt`);
	const message = await channel.send({
		content: `Attaching Character: ${character.name}`,
		files:[attachment]
	}).catch(errorReturnNull);
	if (pin && message?.pinnable) {
		await message.pin();
	}
	return Promise.resolve();
}

function jsonToCharacter(rawJson: TRawJson): TPlayerCharacter | null {
	const fields = PdfJsonFields.inputToFields(rawJson);
	if (PdfJsonParserJoe.isJoePdf(rawJson, fields)) {
		const core = PdfJsonParserJoe.parseCharacter(fields);
		return core ? new PlayerCharacterJoe(core) : null;
	}
	if (PdfJsonParserPR.isPowerRangerPdf(rawJson, fields)) {
		const core = PdfJsonParserPR.parseCharacter(fields);
		return core ? new PlayerCharacterPR(core) : null;
	}
	return null;
}

function saveCharacter(character: TPlayerCharacter): Promise<boolean> {
	return writeFile(getPath(character.id), character.toJSON(), true).catch(errorReturnFalse);
}
async function loadCharacter(characterId: UUID): Promise<TPlayerCharacter | null> {
	const core = await readJsonFile<TPlayerCharacterCore>(getPath(characterId)).catch(errorReturnNull);
	if (core?.gameType === "E20 - G.I. Joe") {
		return new PlayerCharacterJoe(core);
	}
	if (core?.gameType === "E20 - Power Rangers") {
		return new PlayerCharacterPR(core);
	}
	return null;
}
function getPath(characterId: string): string {
	return `./data/sage/e20/${characterId}.json`;
}

async function postCharacter(sageCache: SageCache, channel: TChannel, character: TPlayerCharacter, pin: boolean): Promise<void> {
	const saved = await saveCharacter(character);
	if (saved) {
		const output = prepareOutput(sageCache, character);
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

async function updateSheet(sageInteraction: SageInteraction, character: TPlayerCharacter) {
	const output = prepareOutput(sageInteraction.caches, character);
	const message = sageInteraction.interaction.message as Message;
	await message.edit(output);
}

function getActiveSections(character: TPlayerCharacter): TCharacterSectionType[] {
	const activeView = character.getSheetValue<TCharacterViewType>("activeView");
	const activeSections = character.getSheetValue<TCharacterSectionType[]>("activeSections");
	return getCharacterSections(activeView) ?? activeSections ?? getCharacterSections("Combat") ?? [];
}

function createViewSelectRow(character: TPlayerCharacter): MessageActionRow {
	const selectMenu = new MessageSelectMenu();
	selectMenu.setCustomId(`${character.id}|View`);
	selectMenu.setPlaceholder("Character Sheet Sections");
	selectMenu.setMinValues(1);

	const activeSections = getActiveSections(character);

	const validSectionTypes: TCharacterSectionType[] = character.getValidSectionsTypes();
	validSectionTypes.sort();
	validSectionTypes.forEach(sectionType => {
		selectMenu.addOptions({
			label: sectionType,
			value: sectionType,
			default: activeSections.includes(sectionType)
		});
	});

	const validViewTypes: TCharacterViewType[] = character.getValidViewTypes();
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

	return new MessageActionRow().addComponents(selectMenu);
}

function createSkillSelectRow(character: TPlayerCharacter): MessageActionRow {
	const selectMenu = new MessageSelectMenu();
	selectMenu.setCustomId(`${character.id}|Skill`);
	selectMenu.setPlaceholder("Select a Skill to Roll");

	const activeSkill = character.getSheetValue("activeSkill");
	character.abilities.forEach(ability => {
		ability.skills?.forEach(skill => {
			const dieOrMod = skill.bonus || skill.die ? (skill.die ?? toMod(+skill.bonus!)) : "(untrained)";
			selectMenu.addOptions({
				label: `Skill Roll: ${skill.name} ${dieOrMod}`,
				value: skill.name,
				default: skill.name === activeSkill || (!activeSkill && skill.name === "Initiative")
			});
			skill.specializations?.forEach(spec => {
				const specMod = dieOrMod !== "(untrained)" ? "!" : "";
				selectMenu.addOptions({
					label: `Specialization Roll: ${spec.name} ${dieOrMod}${specMod}`,
					value: spec.name,
					default: spec.name === activeSkill || (!activeSkill && spec.name === "Initiative")
				});
			});
		});
	});

	return new MessageActionRow().addComponents(selectMenu);
}

function createButton(customId: string, label: string, style: MessageButtonStyleResolvable): MessageButton {
	const button = new MessageButton();
	button.setCustomId(customId);
	button.setLabel(label);
	button.setStyle(style);
	return button;
}

function createRollButtonRow(character: TPlayerCharacter): MessageActionRow {
	const rollButton = createButton(`${character.id}|Roll`, `Roll Check`, "PRIMARY");
	const rollSecretButton = createButton(`${character.id}|Secret`, `Roll Secret Check`, "PRIMARY");
	const rollInitButton = createButton(`${character.id}|Init`, `Roll Initiative`, "PRIMARY");
	return new MessageActionRow().addComponents(rollButton, rollSecretButton, rollInitButton);
}

function createComponents(character: TPlayerCharacter): MessageActionRow[] {
	return [
		createViewSelectRow(character),
		createSkillSelectRow(character),
		createRollButtonRow(character)
	];
}

type TOutput = { embeds:MessageEmbed[], components:MessageActionRow[] };
function prepareOutput(sageCache: SageCache, character: TPlayerCharacter): TOutput {
	const embeds = resolveToEmbeds(sageCache, character.toHtml(getActiveSections(character)));
	const components = createComponents(character);
	return { embeds, components };
}

const uuidActionRegex = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\|(?:View|Exploration|Skill|Macro|Roll|Secret|Init|MacroRoll)$/i;

function sheetTester(sageInteraction: SageInteraction): boolean {
	return uuidActionRegex.test(sageInteraction.interaction.customId);
}

async function viewHandler(sageInteraction: SageInteraction<SelectMenuInteraction>, character: TPlayerCharacter): Promise<void> {
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

async function skillHandler(sageInteraction: SageInteraction<SelectMenuInteraction>, character: TPlayerCharacter): Promise<void> {
	const activeSkill = sageInteraction.interaction.values[0];
	character.setSheetValue("activeSkill", activeSkill);
	await saveCharacter(character);
	return updateSheet(sageInteraction, character);
}

async function rollHandler(sageInteraction: SageInteraction<ButtonInteraction>, character: TPlayerCharacter, secret = false): Promise<void> {
	const skillName = character.getSheetValue<string>("activeSkill") ?? "Initiative";
	const ability = character.abilities.find(abil => abil.skills.find(sk => sk.name === skillName || sk.specializations?.find(spec => spec.name === skillName)));
	const skill = ability?.skills.find(sk => sk.name === skillName || sk.specializations?.find(spec => spec.name === skillName));
	const specialization = skill?.specializations?.find(spec => spec.name === skillName);
	const plusMinus = ""; // edge ? "+" : snag ? "-" : "";
	const skillDie = skill?.die ?? "d20";
	const specBang = specialization ? "!" : "";
	const dice = `[${plusMinus}${skillDie}${specBang} ${character.name}${secret ? " Secret" : ""} ${skillName}]`;
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
		const command = actionParts[1] as "View" | "Exploration" | "Skill" | "Macro" | "Roll" | "Secret" | "Init" | "MacroRoll";
		switch(command) {
			case "View": return viewHandler(sageInteraction, character);
			// case "Exploration": return explorationHandler(sageInteraction, character);
			case "Skill": return skillHandler(sageInteraction, character);
			// case "Macro": return macroHandler(sageInteraction, character);
			case "Roll": return rollHandler(sageInteraction, character, false);
			case "Secret": return rollHandler(sageInteraction, character, true);
			// case "Init": return rollHandler(sageInteraction, character, false, true);
			// case "MacroRoll": return macroRollHandler(sageInteraction, character);
		}
	}
	return Promise.resolve();
}

export function registerCommandHandlers(): void {
	registerInteractionListener(sheetTester, sheetHandler);
}
export const e20Pdf = "e20-pdf";

export async function slashHandlerEssence20(sageInteraction: SageInteraction): Promise<void> {
	const attachment = sageInteraction.getAttachmentPdf(e20Pdf, true);
	const rawJson = await PdfCacher.read<TRawJson>(attachment.url);

	const character = jsonToCharacter(rawJson);
	if (!character) {
		return sageInteraction.reply(`Failed to import character from: ${attachment.name}!`, true);
	}

	const channel = sageInteraction.interaction.channel ?? sageInteraction.user;

	const pin = sageInteraction.getBoolean("pin") ?? false;
	const attach = sageInteraction.getBoolean("attach") ?? false;
	if (attach) {
		await attachCharacter(sageInteraction.caches, channel, attachment.name!, character, pin);
	}else {
		await postCharacter(sageInteraction.caches, channel, character, pin);
	}
	return sageInteraction.deleteReply();
}