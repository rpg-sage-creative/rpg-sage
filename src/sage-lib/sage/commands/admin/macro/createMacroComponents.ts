import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { TMacro } from "../../../model/types.js";
import { createMessageDeleteButton } from "../../../model/utils/deleteButton.js";
import { createListComponents } from "./createListComponents.js";
import { createCustomId as _createCustomId, type MacroAction } from "./customId.js";
import type { Args } from "./getArgs.js";
import type { Macro } from "./HasMacros.js";

function createCustomId(sageCommand: SageCommand, { name }: TMacro, action: MacroAction): string {
	const userId = sageCommand.actorId;
	const ownerId = userId;
	const type = "user";
	return _createCustomId({ action, ownerId, name, type, userId });
}

function createNewMacroButton(sageCommand: SageCommand, macro: Macro): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId(sageCommand, macro, "newMacro"))
		.setStyle(ButtonStyle.Secondary)
		.setLabel(sageCommand.getLocalizer()("NEW"))
		.setDisabled(true)
		;
}

function createShowEditMacroButton(sageCommand: SageCommand, macro: Macro): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId(sageCommand, macro, "showEditMacro"))
		.setStyle(ButtonStyle.Primary)
		.setLabel(sageCommand.getLocalizer()("EDIT"))
		;
}

function createCopyMacroButton(sageCommand: SageCommand, macro: Macro): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId(sageCommand, macro, "copyMacro"))
		.setStyle(ButtonStyle.Secondary)
		.setLabel(sageCommand.getLocalizer()("COPY"))
		.setDisabled(true)
		;
}

function createDeleteMacroButton(sageCommand: SageCommand, macro: Macro): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId(sageCommand, macro, "promptDeleteMacro"))
		.setStyle(ButtonStyle.Danger)
		.setLabel(sageCommand.getLocalizer()("DELETE"))
		;
}

export function createMacroComponents(sageCommand: SageCommand, args: Args): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] {
	const components = createListComponents(sageCommand, args);

	const macro = args.owner.find({ name:args.selectedMacro });
	if (!macro) return components;

	const newButton = createNewMacroButton(sageCommand, macro);
	const editButton = createShowEditMacroButton(sageCommand, macro);
	const copyButton = createCopyMacroButton(sageCommand, macro);
	const deleteButton = createDeleteMacroButton(sageCommand, macro);
	const closeButton = createMessageDeleteButton(sageCommand, { label:sageCommand.getLocalizer()("CLOSE"), style:ButtonStyle.Secondary });

	components.pop();
	components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(newButton, editButton, copyButton, deleteButton, closeButton));

	return components;
}