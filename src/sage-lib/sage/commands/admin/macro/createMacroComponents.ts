import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createCloseButton, createListComponents, createListComponentsAndMode, createResetControlButton, createToggleModeButton, type CreateArgs } from "./createListComponents.js";
import { createCustomId } from "./customId.js";
import type { Args } from "./getArgs.js";

function createRollMacroButton({ actorId, localize, messageId, state }: CreateArgs): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId({ action:"rollMacro", actorId, messageId, state }))
		.setStyle(ButtonStyle.Primary)
		.setLabel(localize("ROLL"))
		;
}

function createShowMacroArgsButton({ actorId, localize, messageId, state }: CreateArgs, disabled?: boolean): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId({ action:"showMacroArgs", actorId, messageId, state }))
		.setStyle(ButtonStyle.Secondary)
		.setLabel(localize("PROMPT_ROLL"))
		.setDisabled(disabled === true)
		;
}


function createNewMacroButton({ actorId, localize, messageId, state }: CreateArgs): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId({ action:"showNewMacroModal", actorId, messageId, state }))
		.setStyle(ButtonStyle.Secondary)
		.setLabel(localize("NEW"))
		;
}

function createShowEditMacroModalButton({ actorId, localize, messageId, state }: CreateArgs): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId({ action:"showEditMacroModal", actorId, messageId, state }))
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

export async function createMacroComponents(sageCommand: SageCommand, args: Args): Promise<ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[]> {

	if (!args.macro) return createListComponents(sageCommand, args);

	const componentsAndMode = await createListComponentsAndMode(sageCommand, args, true);
	let { components, mode } = componentsAndMode;
	if (args.customIdArgs?.action === "selectMacro") {
		mode = "roll";
	}


	const localize = sageCommand.getLocalizer();

	const { actorId } = sageCommand;
	const messageId = args.customIdArgs?.messageId;
	const state = args.state.next;
	const buttonArgs = { actorId, localize, messageId, mode, state };

	const buttonRow = new ActionRowBuilder<ButtonBuilder>();

	const canInfo = args.customIdArgs?.actorId === sageCommand.actorId;
	const canEdit = await args.macros?.canActorEdit(sageCommand);

	if (mode === "edit" && canEdit) {
		buttonRow.addComponents(
			createNewMacroButton(buttonArgs),
			createShowEditMacroModalButton(buttonArgs),
			createDeleteMacroButton(buttonArgs),
			createToggleModeButton(buttonArgs),
		);

	}else if (mode === "other" && canInfo) {
		buttonRow.addComponents(
			createResetControlButton(buttonArgs),
			createToggleModeButton(buttonArgs),
		);

	}else {
		buttonRow.addComponents(
			createRollMacroButton(buttonArgs),
			createShowMacroArgsButton(buttonArgs, !args.macro.hasArgs),
		);
		if (!canEdit) {
			buttonRow.addComponents(
				createResetControlButton(buttonArgs),
			);
		}
		buttonRow.addComponents(
			createCloseButton(sageCommand),
		);
		if (canEdit) {
			buttonRow.addComponents(
				createToggleModeButton(buttonArgs),
			);
		}

	}

	components.push(buttonRow);

	return components;
}