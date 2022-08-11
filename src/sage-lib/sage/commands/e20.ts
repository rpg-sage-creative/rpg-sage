import { ButtonInteraction, Message, MessageActionRow, MessageAttachment, MessageButton, MessageButtonStyleResolvable, MessageEmbed, MessageSelectMenu, SelectMenuInteraction } from "discord.js";
import { PdfJsonFields, TRawJson } from "../../../sage-e20/common/pdf";
import { PdfJsonParserJoe } from "../../../sage-e20/joe/parse";
import PlayerCharacterJoe, { PlayerCharacterCoreJoe } from "../../../sage-e20/joe/PlayerCharacterJoe";
import { PdfJsonParserPR } from "../../../sage-e20/pr/parse";
import PlayerCharacterPR, { getCharacterSections, PlayerCharacterCorePR, TCharacterSectionType, TCharacterViewType } from "../../../sage-e20/pr/PlayerCharacterPR";
import { PdfJsonParserTransformer } from "../../../sage-e20/transformer/parse";
import PlayerCharacterTransformer, { PlayerCharacterCoreTransformer } from "../../../sage-e20/transformer/PlayerCharacterTransformer";
import type { Optional, UUID } from "../../../sage-utils";
import { errorReturnFalse, errorReturnNull } from "../../../sage-utils/utils/ConsoleUtils/Catchers";
import { readJsonFile, writeFile } from "../../../sage-utils/utils/FsUtils";
import { PdfCacher } from "../../../sage-utils/utils/PdfUtils";
import { DiscordId, DiscordKey, DUser, NilSnowflake, TChannel } from "../../discord";
import { resolveToEmbeds } from "../../discord/embeds";
import { registerInteractionListener } from "../../discord/handlers";
import type SageCache from "../model/SageCache";
import type SageInteraction from "../model/SageInteraction";
import { parseDiceMatches, sendDice } from "./dice";

type TPlayerCharacter = PlayerCharacterJoe | PlayerCharacterPR | PlayerCharacterTransformer;
type TPlayerCharacterCore = PlayerCharacterCoreJoe | PlayerCharacterCorePR | PlayerCharacterCoreTransformer;

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
	if (PdfJsonParserTransformer.isTransformerPdf(rawJson, fields)) {
		const core = PdfJsonParserTransformer.parseCharacter(fields);
		return core ? new PlayerCharacterTransformer(core) : null;
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
	if (core?.gameType === "E20 - Transformers") {
		return new PlayerCharacterTransformer(core);
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

function createEdgeSnagRow(character: TPlayerCharacter): MessageActionRow {
	const selectMenu = new MessageSelectMenu();
	selectMenu.setCustomId(`${character.id}|EdgeSnag`);
	selectMenu.setPlaceholder("Do you have an Edge or a Snag?");

	const activeEdgeSnag = character.getSheetValue("activeEdgeSnag")!;

	selectMenu.addOptions(
		{ label: `Edge / Snag: Edge`, value: `Edge`, default: activeEdgeSnag === "Edge" },
		{ label: `Edge / Snag: None`, value: `None`, default: !["Edge", "Snag"].includes(activeEdgeSnag) },
		{ label: `Edge / Snag: Snag`, value: `Snag`, default: activeEdgeSnag === "Snag" }
	);

	return new MessageActionRow().addComponents(selectMenu);
}

function countTrainedAndSpecs(character: TPlayerCharacter): number {
	let count = 0;
	character.abilities.forEach(ability => {
		ability.skills?.forEach(skill => {
			if (skill.die) {
				count += 1 + (skill.specializations?.length ?? 0);
			}
		});
	});
	if ("zord" in character) {
		character.zord.abilities?.forEach(ability => {
			ability.skills?.forEach(skill => {
				if (skill.die) {
					count += 1;
				}
			});
		});
	}
	return count;
}
function createSkillSelectRow(character: TPlayerCharacter, includeSpecs: boolean): MessageActionRow {
	const selectMenu = new MessageSelectMenu();
	selectMenu.setCustomId(`${character.id}|Skill`);
	selectMenu.setPlaceholder("Select a Skill to Roll");

	const activeSkill = character.getSheetValue("activeSkill");

	character.abilities.forEach(ability => {
		ability.skills?.forEach(skill => {
			if (!skill.die) {
				return;
			}
			selectMenu.addOptions({
				label: `Skill Roll: ${skill.name} +${skill.die}`,
				value: skill.name,
				default: isDefault(skill.name)
			});
			if (includeSpecs) {
				skill.specializations?.forEach(spec => {
					selectMenu.addOptions({
						label: `Specialization Roll: ${spec.name} +${skill.die}*`,
						value: spec.name,
						default: isDefault(spec.name)
					});
				});
			}
		});
	});

	if ("zord" in character) {
		character.zord.abilities?.forEach(ability => {
			ability.skills?.forEach(skill => {
				if (!skill.die) {
					return;
				}
				const skillName = `Zord ${skill.name}`;
				selectMenu.addOptions({
					label: `Zord Skill Roll: ${skill.name ?? "Unlabeled"} ${skill.die}`,
					value: skillName,
					default: isDefault(skillName)
				});
			});
		});
	}

	return new MessageActionRow().addComponents(selectMenu);

	function isDefault(name: string): boolean {
		return name === activeSkill || (!activeSkill && name === "Initiative");
	}
}
function createSkillSpecializationSelectRow(character: TPlayerCharacter): MessageActionRow {
	const selectMenu = new MessageSelectMenu();
	selectMenu.setCustomId(`${character.id}|Spec`);
	selectMenu.setPlaceholder("Select a Specialization to Roll");

	const activeSkill = character.getSheetValue("activeSkill");
	character.abilities.forEach(ability => {
		ability.skills?.forEach(skill => {
			if (!skill.die) {
				return;
			}
			skill.specializations?.forEach(spec => {
				selectMenu.addOptions({
					label: `Specialization Roll: ${spec.name} +${skill.die}*`,
					value: spec.name,
					default: spec.name === activeSkill
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

type TEdgeSnag = "Edge" | "Snag";
function createRollButtonRow(character: TPlayerCharacter): MessageActionRow {
	const activeEdgeSnag = character.getSheetValue<TEdgeSnag>("activeEdgeSnag");
	const testColor = testEdgeSnag(activeEdgeSnag, { edge:"SUCCESS", snag:"DANGER", none:"PRIMARY" }) as MessageButtonStyleResolvable;
	const untrainedColor = testEdgeSnag(activeEdgeSnag, { edge:"PRIMARY", snag:"DANGER", none:"DANGER" }) as MessageButtonStyleResolvable;
	const rollButton = createButton(`${character.id}|Roll`, `Roll Test`, testColor);
	const rollSecretButton = createButton(`${character.id}|Secret`, `Roll Secret Test`, testColor);
	const rollInitButton = createButton(`${character.id}|Init`, `Roll Initiative`, testColor);
	const rollUntrainedButton = createButton(`${character.id}|Untrained`, `Roll Untrained`, untrainedColor);
	return new MessageActionRow().addComponents(rollButton, rollSecretButton, rollInitButton, rollUntrainedButton);
}

function createComponents(character: TPlayerCharacter): MessageActionRow[] {
	const countSkillOptions = countTrainedAndSpecs(character);
	const includeSpecs = countSkillOptions < 25;
	return [
		createViewSelectRow(character),
		createSkillSelectRow(character, includeSpecs),
		!includeSpecs ? createSkillSpecializationSelectRow(character) : null!,
		createEdgeSnagRow(character),
		createRollButtonRow(character)
	].filter(row => row);
}

type TOutput = { embeds:MessageEmbed[], components:MessageActionRow[] };
function prepareOutput(sageCache: SageCache, character: TPlayerCharacter): TOutput {
	const embeds = resolveToEmbeds(sageCache, character.toHtml(getActiveSections(character) as any));
	const components = createComponents(character);
	return { embeds, components };
}

const uuidActionRegex = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\|(?:View|Skill|Spec|EdgeSnag|Roll|Secret|Init|Untrained)$/i;

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

async function edgeSnagHandler(sageInteraction: SageInteraction, character: TPlayerCharacter): Promise<void> {
	const activeEdgeSnag = testEdgeSnag(sageInteraction.interaction.values[0], { edge:"Edge", snag:"Snag", none:undefined });
	character.setSheetValue("activeEdgeSnag", activeEdgeSnag);
	await saveCharacter(character);
	return updateSheet(sageInteraction, character);
}
function testEdgeSnag<T>(value: Optional<TEdgeSnag>, values: { edge: T, snag: T, none: T }): T {
	switch(value) {
		case "Edge": return values.edge;
		case "Snag": return values.snag;
		default: return values.none;
	}
}
async function rollHandler(sageInteraction: SageInteraction<ButtonInteraction>, character: TPlayerCharacter, secret = false, init = false, untrained = false): Promise<void> {
	let dice = "";
	if (untrained) {
		dice = `[-d20 ${character.name} Untrained]`;
	}else {
		const skillName = init ? "Initiative" : character.getSheetValue<string>("activeSkill") ?? "Initiative";
		const ability = character.abilities.find(abil => abil.skills.find(sk => sk.name === skillName || sk.specializations?.find(spec => spec.name === skillName)));
		const skill = ability?.skills.find(sk => sk.name === skillName || sk.specializations?.find(spec => spec.name === skillName));
		const specialization = skill?.specializations?.find(spec => spec.name === skillName);
		const plusMinus = testEdgeSnag(character.getSheetValue<TEdgeSnag>("activeEdgeSnag"), { edge:"+", snag:"-", none:"" });
		const skillDie = skill?.die ?? "d20";
		const specBang = specialization ? "!" : "";
		dice = `[${plusMinus}${skillDie}${specBang} ${character.name}${secret ? " Secret" : ""} ${skillName}]`;
	}
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
		const command = actionParts[1] as "View" | "Skill" | "Spec" | "EdgeSnag" | "Roll" | "Secret" | "Init" | "Untrained";
		switch(command) {
			case "View": return viewHandler(sageInteraction, character);
			case "Skill": case "Spec": return skillHandler(sageInteraction, character);
			case "EdgeSnag": return edgeSnagHandler(sageInteraction, character);
			case "Roll": return rollHandler(sageInteraction, character, false);
			case "Secret": return rollHandler(sageInteraction, character, true);
			case "Init": return rollHandler(sageInteraction, character, false, true);
			case "Untrained": return rollHandler(sageInteraction, character, false, false, true);
		}
	}
	return Promise.resolve();
}

export function registerCommandHandlers(): void {
	registerInteractionListener(sheetTester, sheetHandler);
}

export const e20Pdf = "e20-pdf";

export async function slashHandlerEssence20(sageInteraction: SageInteraction): Promise<void> {
	const value = sageInteraction.getString(e20Pdf, true);
	const isPdfUrl = value.match(/^http.*?\.pdf$/) !== null;
	const isMessageUrl = value.startsWith("https://discord.com/channels/");

	let fileName: string | undefined;
	let rawJson: TRawJson | undefined;
	if (isPdfUrl) {
		fileName = value.split("/").pop();
		rawJson = await PdfCacher.read<TRawJson>(value);
	}else if (isMessageUrl) {
		const [serverDid, channelDid, messageDid] = value.split("/").slice(-3);
		const discordKey = new DiscordKey(serverDid.replace("@me", NilSnowflake), channelDid, NilSnowflake, messageDid);
		const message = await sageInteraction.discord.fetchMessage(discordKey);
		const attachment = message?.attachments.find(att => att.contentType === "application/pdf" || att.name?.endsWith(".pdf") === true);
		if (attachment) {
			fileName = attachment.name ?? undefined;
			rawJson = await PdfCacher.read<TRawJson>(attachment?.url);
		}
	}
	if (!rawJson) {
		return sageInteraction.update(`Failed to find pdf!`, true);
	}

	const character = jsonToCharacter(rawJson);
	if (!character) {
		return sageInteraction.update(`Failed to import character from: ${fileName}!`, true);
	}

	await sageInteraction.update(`Importing ${character.name ?? "<i>Unnamed Character</i>"} ...`, false);

	const channel = sageInteraction.interaction.channel ?? sageInteraction.user;

	const pin = sageInteraction.getBoolean("pin") ?? false;
	const attach = sageInteraction.getBoolean("attach") ?? false;
	if (attach) {
		await attachCharacter(sageInteraction.caches, channel, fileName!, character, pin);
	}else {
		await postCharacter(sageInteraction.caches, channel, character, pin);
	}
	return sageInteraction.deleteReply();
}
