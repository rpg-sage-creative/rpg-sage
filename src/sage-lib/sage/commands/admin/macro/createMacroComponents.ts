import type { Snowflake } from "@rsc-utils/core-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";
import type { Localizer } from "../../../../../sage-lang/getLocalizedText.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createMessageDeleteButton } from "../../../model/utils/deleteButton.js";
import { createListComponents } from "./createListComponents.js";
import { createCustomId } from "./customId.js";
import type { Args, MacroState } from "./getArgs.js";

type CreateArgs = { actorId: Snowflake; localize: Localizer; messageId?: Snowflake; state: MacroState; };

function createNewMacroButton({ actorId, localize, messageId, state }: CreateArgs): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId({ action:"showNewMacro", actorId, messageId, state }))
		.setStyle(ButtonStyle.Secondary)
		.setLabel(localize("NEW"))
		;
}

function createShowEditMacroButton({ actorId, localize, messageId, state }: CreateArgs): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId({ action:"showEditMacro", actorId, messageId, state }))
		.setStyle(ButtonStyle.Primary)
		.setLabel(localize("EDIT"))
		;
}

// function createCopyMacroButton({ actorId, localize, messageId, state }: CreateArgs): ButtonBuilder {
// 	return new ButtonBuilder()
// 		.setCustomId(createCustomId({ action:"copyMacro", actorId, messageId, state }))
// 		.setStyle(ButtonStyle.Secondary)
// 		.setLabel(localize("COPY"))
// 		.setDisabled(true)
// 		;
// }

function createDeleteMacroButton({ actorId, localize, messageId, state }: CreateArgs): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId({ action:"promptDeleteMacro", actorId, messageId, state }))
		.setStyle(ButtonStyle.Danger)
		.setLabel(localize("DELETE"))
		;
}

export function createMacroComponents(sageCommand: SageCommand, args: Args): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] {

	const components = createListComponents(sageCommand, args);

	if (!args.macro) return components;

	const { actorId } = sageCommand;
	const localize = sageCommand.getLocalizer();
	const messageId = args.customIdArgs?.messageId;
	const state = args.state.next;
	const buttonArgs = { actorId, localize, messageId, state };

	const newButton = createNewMacroButton(buttonArgs);
	const editButton = createShowEditMacroButton(buttonArgs);
	// const copyButton = createCopyMacroButton(buttonArgs);
	const deleteButton = createDeleteMacroButton(buttonArgs);
	const closeButton = createMessageDeleteButton(sageCommand, { label:localize("CLOSE"), style:ButtonStyle.Secondary });

	components.pop();
	components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(newButton, editButton, deleteButton, closeButton));

	return components;
}