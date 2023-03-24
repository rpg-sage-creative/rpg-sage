import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Message, StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";
import { shiftDie } from "../../../sage-dice/dice/essence20";
import { PdfJsonFields, TRawJson } from "../../../sage-e20/common/pdf";
import type { TSkillE20, TSkillSpecialization, TStatE20 } from "../../../sage-e20/common/PlayerCharacterE20";
import { PdfJsonParserJoe } from "../../../sage-e20/joe/parse";
import PlayerCharacterJoe, { PlayerCharacterCoreJoe } from "../../../sage-e20/joe/PlayerCharacterJoe";
import { PdfJsonParserPR } from "../../../sage-e20/pr/parse";
import PlayerCharacterPR, { getCharacterSections, PlayerCharacterCorePR, TCharacterSectionType, TCharacterViewType, TSkillZord, TStatZord } from "../../../sage-e20/pr/PlayerCharacterPR";
import { PdfJsonParserTransformer } from "../../../sage-e20/transformer/parse";
import PlayerCharacterTransformer, { PlayerCharacterCoreTransformer } from "../../../sage-e20/transformer/PlayerCharacterTransformer";
import type { Optional, UUID } from "../../../sage-utils";
import { errorReturnFalse, errorReturnNull } from "../../../sage-utils/utils/ConsoleUtils/Catchers";
import type { DMessageChannel, DMessageTarget } from "../../../sage-utils/utils/DiscordUtils";
import DiscordId from "../../../sage-utils/utils/DiscordUtils/DiscordId";
import { resolveToEmbeds } from "../../../sage-utils/utils/DiscordUtils/embeds";
import { fileExistsSync, readJsonFile, writeFile } from "../../../sage-utils/utils/FsUtils";
import { PdfCacher } from "../../../sage-utils/utils/PdfUtils";
import { registerInteractionListener } from "../../discord/handlers";
import type SageCache from "../model/SageCache";
import type SageInteraction from "../model/SageInteraction";
import { parseDiceMatches, sendDice } from "./dice";

type TPlayerCharacter = PlayerCharacterJoe | PlayerCharacterPR | PlayerCharacterTransformer;
type TPlayerCharacterCore = PlayerCharacterCoreJoe | PlayerCharacterCorePR | PlayerCharacterCoreTransformer;

function createSelectMenuRow(selectMenu: StringSelectMenuBuilder): ActionRowBuilder<StringSelectMenuBuilder> {
	if (selectMenu.options.length > 25) {
		selectMenu.options.length = 25;
	}
	return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
}

async function attachCharacter(sageCache: SageCache, channel: DMessageTarget, attachmentName: string, character: TPlayerCharacter, pin: boolean): Promise<void> {
	const raw = resolveToEmbeds(character.toHtml(), sageCache.getFormatter()).map(e => e.data.description).join("");
	const buffer = Buffer.from(raw, "utf-8");
	const attachment = new AttachmentBuilder(buffer, { name:`${attachmentName}.txt` });
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
function charFileExists(characterId: string): boolean {
	return fileExistsSync(getPath(characterId));
}
function getPath(characterId: string): string {
	return `./data/sage/e20/${characterId}.json`;
}

async function postCharacter(sageCache: SageCache, channel: DMessageChannel, character: TPlayerCharacter, pin: boolean): Promise<void> {
	const saved = await saveCharacter(character);
	if (saved) {
		const output = prepareOutput(sageCache, character);
		const message = await channel.send(output).catch(errorReturnNull);
		if (pin && message?.pinnable) {
			await message.pin();
		}
	}else {
		const output = { embeds:resolveToEmbeds(character.toHtml(), sageCache.getFormatter()) };
		const message = await channel.send(output).catch(errorReturnNull);
		if (pin && message?.pinnable) {
			await message.pin();
		}
	}
}

async function updateSheet(sageInteraction: SageInteraction, character: TPlayerCharacter) {
	const output = prepareOutput(sageInteraction.sageCache, character);
	const message = sageInteraction.interaction.message as Message;
	await message.edit(output);
}

function getActiveSections(character: TPlayerCharacter): TCharacterSectionType[] {
	const activeView = character.getSheetValue<TCharacterViewType>("activeView");
	const activeSections = character.getSheetValue<TCharacterSectionType[]>("activeSections");
	return getCharacterSections(activeView) ?? activeSections ?? getCharacterSections("Combat") ?? [];
}

function createViewSelectRow(character: TPlayerCharacter): ActionRowBuilder<StringSelectMenuBuilder> {
	const selectMenu = new StringSelectMenuBuilder();
	selectMenu.setCustomId(`E20|${character.id}|View`);
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

	return createSelectMenuRow(selectMenu);
}

function createEdgeSnagShiftRow(character: TPlayerCharacter): ActionRowBuilder<StringSelectMenuBuilder> {
	const selectMenu = new StringSelectMenuBuilder();
	selectMenu.setCustomId(`E20|${character.id}|EdgeSnagShift`);
	selectMenu.setPlaceholder("Edge, Snag, Upshift, Downshift");
	selectMenu.setMinValues(1);

	const activeValues = getActiveEdgeSnagShiftValues<string>(character);
	if (activeValues.includes("Nothing")) {
		activeValues.length = 0;
	}

	selectMenu.addOptions({ label: "No Changes", value: "Nothing", default: false });
	["Edge","Snag"].forEach(val => selectMenu.addOptions(
		{ label: val, value: val, default: activeValues.includes(val) }
	));
	[["Upshift", "+"], ["Downshift", "-"]].forEach(([label, sign]) => {
		[1,2,3].forEach(num => selectMenu.addOptions(
			{ label: `${label} ${num}`, value: `${sign}${num}`, default: activeValues.includes(`${sign}${num}`) }
		));
	});

	return createSelectMenuRow(selectMenu);
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
function createSkillSelectRow(character: TPlayerCharacter, includeSpecs: boolean): ActionRowBuilder<StringSelectMenuBuilder> {
	const selectMenu = new StringSelectMenuBuilder();
	selectMenu.setCustomId(`E20|${character.id}|Skill`);
	selectMenu.setPlaceholder("Select a Skill to Roll");

	const activeSkill = character.getSheetValue("activeSkill");
	const activeEdgeSnagShift = getActiveEdgeSnagShiftValues(character);

	character.abilities.forEach(ability => {
		ability.skills?.forEach(skill => {
			const skillDie = skill.die;
			if (!skillDie) {
				return;
			}
			const { label, specLabel } = shiftDie(skillDie, activeEdgeSnagShift);
			selectMenu.addOptions({
				label: `Skill Roll: ${skill.name} ${label}`,
				value: skill.name,
				default: isDefault(skill.name)
			});
			if (includeSpecs) {
				skill.specializations?.forEach((spec, index) => {
					const specValue = `${skill.name}-${index}-${spec.name}`;
					selectMenu.addOptions({
						label: `Specialization Roll: ${skill.name} (${spec.name}) ${specLabel}`,
						value: specValue,
						default: isDefault(specValue)
					});
				});
			}
		});
	});

	if ("zord" in character) {
		character.zord.abilities?.forEach(ability => {
			ability.skills?.forEach(skill => {
				const skillDie = skill.die;
				if (!skillDie) {
					return;
				}
				const { label } = shiftDie(skillDie, activeEdgeSnagShift);
				const skillName = `Zord ${skill.name}`;
				selectMenu.addOptions({
					label: `Zord Skill Roll: ${skill.name ?? "Unlabeled"} ${label}`,
					value: skillName,
					default: isDefault(skillName)
				});
			});
		});
	}

	return createSelectMenuRow(selectMenu);

	function isDefault(name: string): boolean {
		return name === activeSkill || (!activeSkill && name === "Initiative");
	}
}
function createSkillSpecializationSelectRow(character: TPlayerCharacter): ActionRowBuilder<StringSelectMenuBuilder> {
	const selectMenu = new StringSelectMenuBuilder();
	selectMenu.setCustomId(`E20|${character.id}|Spec`);
	selectMenu.setPlaceholder("Select a Specialization to Roll");

	const activeSkill = character.getSheetValue("activeSkill");
	const activeEdgeSnagShift = getActiveEdgeSnagShiftValues(character);

	character.abilities.forEach(ability => {
		ability.skills?.forEach(skill => {
			const skillDie = skill.die;
			if (!skillDie) {
				return;
			}
			const { specLabel } = shiftDie(skillDie, activeEdgeSnagShift);
			skill.specializations?.forEach((spec, index) => {
				const specValue = `${skill.name}-${index}-${spec.name}`;
				selectMenu.addOptions({
					label: `Specialization Roll: ${skill.name} (${spec.name}) ${specLabel}`,
					value: specValue,
					default: specValue === activeSkill
				});
			});
		});
	});

	return createSelectMenuRow(selectMenu);
}

function createButton(customId: string, label: string, style: ButtonStyle): ButtonBuilder {
	const button = new ButtonBuilder();
	button.setCustomId(customId);
	button.setLabel(label);
	button.setStyle(style);
	return button;
}

type TEdgeSnag = "Edge" | "Snag";
type TShift = "+1" | "+2" | "+3" | "-1" | "-2" | "-3";
type TEdgeSnagShift = TEdgeSnag | TShift;
function getActiveEdgeSnagShiftValues<T extends TEdgeSnag | TShift | TEdgeSnagShift | string = TEdgeSnagShift>(character: TPlayerCharacter): T[] {
	const activeValue = character.getSheetValue("activeEdgeSnagShift")
		?? character.getSheetValue("activeEdgeSnag")
		?? "";
	return activeValue.split(",").filter(s => s) as T[];
}

function createRollButtonRow(character: TPlayerCharacter): ActionRowBuilder<ButtonBuilder> {
	const activeEdgeSnagShift = getActiveEdgeSnagShiftValues(character);
	const testColor = testEdgeSnag(activeEdgeSnagShift, { edge:ButtonStyle.Success, snag:ButtonStyle.Danger, none:ButtonStyle.Primary });
	const untrainedColor = testEdgeSnag(activeEdgeSnagShift, { edge:ButtonStyle.Primary, snag:ButtonStyle.Danger, none:ButtonStyle.Danger });
	const rollButton = createButton(`E20|${character.id}|Roll`, `Roll Test`, testColor);
	const rollSecretButton = createButton(`E20|${character.id}|Secret`, `Roll Secret Test`, testColor);
	const rollInitButton = createButton(`E20|${character.id}|Init`, `Roll Initiative`, testColor);
	const rollUntrainedButton = createButton(`E20|${character.id}|Untrained`, `Roll Untrained`, untrainedColor);
	return new ActionRowBuilder<ButtonBuilder>().addComponents(rollButton, rollSecretButton, rollInitButton, rollUntrainedButton);
}

function createComponents(character: TPlayerCharacter): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
	const countSkillOptions = countTrainedAndSpecs(character);
	const includeSpecs = countSkillOptions < 25;
	return [
		createViewSelectRow(character),
		createEdgeSnagShiftRow(character),
		createSkillSelectRow(character, includeSpecs),
		!includeSpecs ? createSkillSpecializationSelectRow(character) : null!,
		createRollButtonRow(character)
	].filter(row => row);
}

type TOutput = { embeds:EmbedBuilder[], components:ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] };
function prepareOutput(sageCache: SageCache, character: TPlayerCharacter): TOutput {
	const embeds = resolveToEmbeds(character.toHtml(getActiveSections(character) as any), sageCache.getFormatter());
	const components = createComponents(character);
	return { embeds, components };
}

const uuidActionRegex = /^E20\|(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\|(?:View|Skill|Spec|EdgeSnag|EdgeSnagShift|Roll|Secret|Init|Untrained)$/i;

function sheetTester(sageInteraction: SageInteraction): boolean {
	const customId = sageInteraction.interaction.customId;
	if (!uuidActionRegex.test(customId)) {
		return false;
	}
	const [_e20, characterId] = customId.split("|");
	return _e20 === "E20" && charFileExists(characterId);
}

async function viewHandler(sageInteraction: SageInteraction<StringSelectMenuInteraction>, character: TPlayerCharacter): Promise<void> {
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

async function skillHandler(sageInteraction: SageInteraction<StringSelectMenuInteraction>, character: TPlayerCharacter): Promise<void> {
	const activeSkill = sageInteraction.interaction.values[0];
	character.setSheetValue("activeSkill", activeSkill);
	await saveCharacter(character);
	return updateSheet(sageInteraction, character);
}

async function edgeSnagShiftHandler(sageInteraction: SageInteraction, character: TPlayerCharacter): Promise<void> {
	const values = sageInteraction.interaction.values;
	if (values.includes("Nothing")) {
		values.length = 0;
	}
	character.setSheetValue("activeEdgeSnagShift", values.join(","));
	await saveCharacter(character);
	return updateSheet(sageInteraction, character);
}
function testEdgeSnag<T>(testValues: TEdgeSnagShift[], outValues: { edge: T, snag: T, none: T }): T {
	const hasEdge = testValues.includes("Edge");
	const hasSnag = testValues.includes("Snag");
	if (hasEdge && !hasSnag) {
		return outValues.edge;
	}else if (!hasEdge && hasSnag) {
		return outValues.snag;
	}else {
		return outValues.none;
	}
}

async function rollHandler(sageInteraction: SageInteraction<ButtonInteraction>, character: TPlayerCharacter, secret = false, init = false, untrained = false): Promise<void> {
	let dice = "";
	if (untrained) {
		dice = `[d20s ${character.name} Untrained]`;
	}else {
		const activeSkill = init ? "Initiative" : character.getSheetValue<string>("activeSkill") ?? "Initiative";
		const isZord = activeSkill.startsWith("Zord ") && "zord" in character;
		let ability: TStatE20 | TStatZord | undefined;
		let skill: TSkillE20 | TSkillZord | undefined;
		let specialization: TSkillSpecialization | undefined;
		if (isZord) {
			ability = character.zord.abilities?.find(abil => abil.skills?.find(sk => activeSkill === `Zord ${sk.name}`));
			skill = ability?.skills?.find(sk => activeSkill === `Zord ${sk.name}`);
		}else {
			ability = character.abilities.find(abil => findSkill(abil, activeSkill));
			skill = findSkill(ability as TStatE20, activeSkill);
			specialization = findSpec(skill as TSkillE20, activeSkill);
		}
		const activeEdgeSnagShift = getActiveEdgeSnagShiftValues(character);
		const skillDie = skill?.die ?? "d20";
		const { shiftedDie, shiftArrow, rollable, label } = shiftDie(skillDie, activeEdgeSnagShift);
		const plus = shiftedDie === "d20" ? "" : "+";
		const specStar = specialization ? "*" : "";
		const edgeSnag = testEdgeSnag(activeEdgeSnagShift, { edge:"e", snag:"s", none:"" });
		const charName = character.name;
		const secretText = secret ? " Secret" : "";
		const skillName = isZord ? activeSkill : skill?.name;
		const specName = specialization ? ` (${specialization.name})` : "";
		if (rollable) {
			dice = `[${plus}${shiftedDie}${specStar}${edgeSnag} ${charName}${secretText} ${skillName}${specName}${shiftArrow}]`;
		}else {
			dice = `[${label} ${charName} ${skillName}${specName}${shiftArrow}]`;
		}
	}
	const matches = await parseDiceMatches(sageInteraction, dice);
	const output = matches.map(match => match.output).flat();
	const sendResults = await sendDice(sageInteraction, output);
	if (sendResults.allSecret && sendResults.hasGmChannel) {
		await sageInteraction.interaction.channel?.send(`${DiscordId.toUserMention(sageInteraction.actor.did)} *Secret Dice sent to the GM* 🎲`);
	}

	function findSkill(ability: Optional<TStatE20>, value: string): TSkillE20 | undefined {
		return ability?.skills.find(skill => skill.name === value || findSpec(skill, value));
	}
	function findSpec(skill: Optional<TSkillE20>, value: string): TSkillSpecialization | undefined {
		return skill?.specializations?.find((spec, index) => `${skill.name}-${index}-${spec.name}` === value);
	}
}

async function sheetHandler(sageInteraction: SageInteraction): Promise<void> {
	await sageInteraction.interaction.deferUpdate();
	const [_E20, characterId, command] = sageInteraction.interaction.customId.split("|");
	const character = await loadCharacter(characterId);
	if (character) {
		switch(command as "View" | "Skill" | "Spec" | "EdgeSnag" | "EdgeSnagShift" | "Roll" | "Secret" | "Init" | "Untrained") {
			case "View": return viewHandler(sageInteraction, character);
			case "Skill": case "Spec": return skillHandler(sageInteraction, character);
			case "EdgeSnag": case "EdgeSnagShift": return edgeSnagShiftHandler(sageInteraction, character);
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

export async function slashHandlerEssence20(sageInteraction: SageInteraction<ChatInputCommandInteraction>): Promise<void> {
	await sageInteraction.reply(`Attempting to import character ...`, false);

	const value = sageInteraction.args.getString(e20Pdf, true);
	const isPdfUrl = value.match(/^http.*?\.pdf$/) !== null;
	const isMessageUrl = value.startsWith("https://discord.com/channels/");

	let fileName: string | undefined;
	let rawJson: TRawJson | undefined;
	if (isPdfUrl) {
		fileName = value.split("/").pop();
		await sageInteraction.reply(`Attempting to read character from ${fileName} ...`, false);
		rawJson = await PdfCacher.read<TRawJson>(value);
	}else if (isMessageUrl) {
		const [serverDid, channelDid, messageDid] = value.split("/").slice(-3);
		let message: Message | null = null;
		if (serverDid === "@me") {
			const forUser = await sageInteraction.sageCache.discord.forUser(channelDid);
			message = await forUser?.fetchMessage(messageDid) ?? null;
		}else {
			const forGuild = await sageInteraction.sageCache.discord.forGuild(serverDid);
			const forChannel = await forGuild?.forUser(sageInteraction.actor.did);
			message = await forChannel?.fetchMessage(messageDid) ?? null;
		}
		// const message = await sageInteraction.discord.fetchMessage(discordKey);
		const attachment = message?.attachments.find(att => att.contentType === "application/pdf" || att.name?.endsWith(".pdf") === true);
		if (attachment) {
			fileName = attachment.name ?? undefined;
			await sageInteraction.reply(`Attempting to read character from ${fileName} ...`, false);
			rawJson = await PdfCacher.read<TRawJson>(attachment?.url);
		}
	}
	if (!rawJson) {
		return sageInteraction.reply(`Failed to find pdf!`, false);
	}

	const character = jsonToCharacter(rawJson);
	if (!character) {
		return sageInteraction.reply(`Failed to import character from: ${fileName}!`, false);
	}

	await sageInteraction.reply(`Importing ${character.name ?? "<i>Unnamed Character</i>"} ...`, false);

	const channel = sageInteraction.interaction.channel as DMessageChannel ?? sageInteraction.actor.d;

	const pin = sageInteraction.args.getBoolean("pin") ?? false;
	const attach = sageInteraction.args.getBoolean("attach") ?? false;
	if (attach) {
		await attachCharacter(sageInteraction.sageCache, channel, fileName!, character, pin);
	}else {
		await postCharacter(sageInteraction.sageCache, channel, character, pin);
	}
	return sageInteraction.deleteReply();
}
