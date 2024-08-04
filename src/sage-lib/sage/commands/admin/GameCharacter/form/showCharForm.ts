import { debug, isNilSnowflake, NIL_SNOWFLAKE } from "@rsc-utils/core-utils";
import { EmbedBuilder } from "@rsc-utils/discord-utils";
import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, type MessagePayloadOption } from "discord.js";
import { registerInteractionListener } from "../../../../../discord/handlers.js";
import { GameCharacter } from "../../../../model/GameCharacter.js";
import type { SageCommand } from "../../../../model/SageCommand.js";
import type { SageInteraction } from "../../../../model/SageInteraction.js";
import { showCharNamesModal } from "./showCharNamesModal.js";
import { createCustomId, parseCustomId } from "./customId.js";
import { getCharToEdit } from "./getCharToEdit.js";
import type { CharId, CharModalAction, CustomIdParts } from "./types.js";
import { showCharImagesModal } from "./showCharImagesModal.js";
import { showCharStatsModal } from "./showCharStatsModal.js";

type SageButtonInteraction = SageInteraction<ButtonInteraction>;
type SageSelectInteraction = SageInteraction<StringSelectMenuInteraction>;

const SelectChar = "SelectChar";
const SelectComp = "SelectComp";
const ShowNames = "ShowNames";
const ShowImages = "ShowImages";
const ShowStats = "ShowStats";
const Save = "Save";

function createButton(customId: string, label: string, style: keyof typeof ButtonStyle, disabled: boolean): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(customId)
		.setLabel(label)
		.setStyle(ButtonStyle[style])
		.setDisabled(disabled);
}

function buildCharForm(sageCommand: SageCommand, charId?: CharId, compId?: CharId): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
	const userId = sageCommand.authorDid;
	const customId = (action: CharModalAction) => createCustomId(userId, charId ?? NIL_SNOWFLAKE, compId ?? NIL_SNOWFLAKE, action);

	const characterSelect = new StringSelectMenuBuilder().setCustomId(customId(SelectChar)).setPlaceholder("Select a Character");
	const characterManager = sageCommand.game?.playerCharacters ?? sageCommand.sageUser.playerCharacters;
	characterManager.filter(char => char.userDid === userId).forEach(char => {
		characterSelect.addOptions(new StringSelectMenuOptionBuilder().setLabel(char.name).setValue(char.id).setDefault(charId === char.id));
	});
	characterSelect.addOptions(new StringSelectMenuOptionBuilder().setLabel(`Create New Character`).setValue(NIL_SNOWFLAKE).setDefault(isNilSnowflake(charId)));

	const char = characterManager.findByName(charId);
	const companionSelect = new StringSelectMenuBuilder().setCustomId(customId(SelectComp)).setPlaceholder("Select a Companion");
	const companionManager = char?.companions;
	companionManager?.forEach(comp => {
		companionSelect.addOptions(new StringSelectMenuOptionBuilder().setLabel(comp.name).setValue(comp.id).setDefault(compId === comp.id));
	});
	companionSelect.addOptions(new StringSelectMenuOptionBuilder().setLabel(`Create New Companion`).setValue(NIL_SNOWFLAKE).setDefault(isNilSnowflake(compId)));

	const buttons = [
		createButton(customId(ShowNames), "Names", "Primary", !charId),
		createButton(customId(ShowImages), "Images", "Primary", !charId),
		createButton(customId(ShowStats), "Stats", "Primary", !charId),
		createButton(customId(Save), "Save", "Success", !charId),
		new ButtonBuilder().setCustomId(`rpg-sage-message-delete-button-${userId}`).setLabel("Cancel").setStyle(ButtonStyle.Secondary),
	];

	const components = [
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(characterSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(companionSelect),
		new ActionRowBuilder<ButtonBuilder>().setComponents(...buttons)
	];

	return components;
}

function buildFormEmbed(char: GameCharacter): EmbedBuilder {
	const embed = new EmbedBuilder();
	embed.setTitle(char.name);
	if (char.avatarUrl) embed.setThumbnail(char.avatarUrl);
	embed.appendDescription(`**Nickname (aka)** ${char.aka ?? "*none*"}`, "\n");
	embed.appendDescription(`**Alias** ${char.alias ?? "*none*"}`, "\n");
	const { displayNameTemplate } = char;
	const displayName = char.toDisplayName();
	if (displayNameTemplate) {
		embed.appendDescription(`**Display Name**`, "\n");
		embed.appendDescription(`- Template: ${"`" + displayNameTemplate + "`"}`, "\n");
		embed.appendDescription(`- Output: ${displayName}`, "\n");
	}else {
		embed.appendDescription(`**Display Name**`, "\n");
		embed.appendDescription(`- Template: *none*`, "\n");
		embed.appendDescription(`- Output: ${displayName}`, "\n");
	}
	return embed;
}

export async function showCharForm(sageCommand: SageCommand, charId?: CharId): Promise<void> {
	sageCommand.replyStack.defer();

	const components = buildCharForm(sageCommand, charId);
	const message = sageCommand.isSageMessage() ? sageCommand.message
		: sageCommand.isSageInteraction("SELECT") || sageCommand.isSageInteraction("BUTTON") || sageCommand.isSageInteraction("MODAL") ? sageCommand.interaction.message
		: undefined;

	const editedChar = charId ? await getCharToEdit(sageCommand, charId) : undefined;
	// const edited = editedChar ? `*(has changes)*` : ``;
	const charOrShell = editedChar ?? (sageCommand.game ?? sageCommand.sageUser).findCharacterOrCompanion(charId!);
	const char = charOrShell && "game" in charOrShell ? charOrShell.game : charOrShell;

	let content = ZERO_WIDTH_SPACE;
	let embeds: EmbedBuilder[] = [];
	let options: MessagePayloadOption | undefined;
	if (char) {
		if (char.tokenUrl) options = { avatarURL:char.tokenUrl };
		embeds.push(buildFormEmbed(char));
	}
	if (message?.components?.find(row => row.components.find(comp => parseCustomId(comp.customId)))) {
		await message.edit({ components, content, embeds, options });
		// await sageCommand.replyStack.deferAndDelete();
	}else {
		await sageCommand.dChannel?.send({ components, content, embeds });
	}
}

async function isCharFormAction(sageInteraction: SageInteraction<ButtonInteraction | StringSelectMenuInteraction>): Promise<CustomIdParts | undefined> {
	const idParts = sageInteraction.parseCustomId(parseCustomId);
	if (idParts) {
		const { customId } = sageInteraction.interaction;
		if ([SelectChar, ShowNames, ShowImages, ShowStats, Save].some(action => customId.endsWith(action))) {
			return idParts;
		}
	}
	return undefined;
}

async function selectCharacter(sageInteraction: SageSelectInteraction): Promise<void> {
	const { interaction } = sageInteraction;
	const charId = (interaction as StringSelectMenuInteraction).values[0];
	const char = await getCharToEdit(sageInteraction, charId);
	if (char) {
		// await selectedChar.saveTemp({ gameId:game?.id, userId:authorDid });
		return showCharForm(sageInteraction, char.id);
	}
	return showCharForm(sageInteraction);
}

async function showNames(sageInteraction: SageButtonInteraction, idParts: CustomIdParts): Promise<void> {
	const char = await getCharToEdit(sageInteraction, idParts.charId);
	if (char) return showCharNamesModal(sageInteraction, char);
	return showCharForm(sageInteraction);
}

async function showImages(sageInteraction: SageButtonInteraction, idParts: CustomIdParts): Promise<void> {
	const char = await getCharToEdit(sageInteraction, idParts.charId);
	if (char) return showCharImagesModal(sageInteraction, char);
	return showCharForm(sageInteraction);
}

async function showStats(sageInteraction: SageButtonInteraction, idParts: CustomIdParts): Promise<void> {
	const char = await getCharToEdit(sageInteraction, idParts.charId);
	if (char) return showCharStatsModal(sageInteraction, char);
	return showCharForm(sageInteraction);
}

async function handleCharFormAction(sageInteraction: SageInteraction, idParts: CustomIdParts): Promise<void> {
	debug({idParts});
	const { interaction, replyStack } = sageInteraction;
	switch(idParts.action) {
		case SelectChar: return selectCharacter(sageInteraction);
		case ShowNames: return showNames(sageInteraction, idParts);
		case ShowImages: return showImages(sageInteraction, idParts);
		case ShowStats: return showStats(sageInteraction, idParts);
		case Save:
			await replyStack.whisper(`Save NOT IMPLEMENTED YET!`);
			return showCharForm(sageInteraction);
		default:
			return replyStack.whisper(`New Code, Who Dis? ${interaction.customId}`);
	}
}

export function registerCharForm(): void {
	registerInteractionListener(isCharFormAction, handleCharFormAction);
}