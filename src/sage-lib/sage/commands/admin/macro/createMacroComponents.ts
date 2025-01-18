import { debug, type Snowflake } from "@rsc-utils/core-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonStyle, StringSelectMenuBuilder, type MessageActionRowComponent } from "discord.js";
import type { Localizer } from "../../../../../sage-lang/getLocalizedText.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createMessageDeleteButton } from "../../../model/utils/deleteButton.js";
import { createListComponents } from "./createListComponents.js";
import { createCustomId } from "./customId.js";
import type { Args, MacroState } from "./getArgs.js";

type CreateArgs = { actorId: Snowflake; localize: Localizer; messageId?: Snowflake; mode:"edit"|"roll"; state: MacroState; };

function createRollMacroButton({ actorId, localize, messageId, state }: CreateArgs): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId({ action:"rollMacro", actorId, messageId, state }))
		.setStyle(ButtonStyle.Primary)
		.setLabel(localize("ROLL"))
		;
}

function createShowMacroArgsButton({ actorId, localize, messageId, state }: CreateArgs): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId({ action:"showMacroArgs", actorId, messageId, state }))
		.setStyle(ButtonStyle.Secondary)
		.setLabel(localize("PROMPT_ROLL"))
		;
}

const GEAR = "⚙️";
const DIE = "🎲";

function createToggleModeButton({ actorId, messageId, mode, state }: CreateArgs): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId({ action:"toggleMacroMode", actorId, messageId, state }))
		.setStyle(ButtonStyle.Secondary)
		.setEmoji(mode === "edit" ? DIE : GEAR)
		;
}

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

function getMacroMode(sageCommand: SageCommand, actorId: Snowflake, messageId: Snowflake | undefined, state: MacroState): "edit" | "roll" {
	const components = sageCommand.isSageInteraction("MESSAGE") ? sageCommand.interaction.message.components
		: sageCommand.isSageMessage() ? sageCommand.message.components
		: undefined;
	if (components?.length) {
		const customId = createCustomId({ action:"toggleMacroMode", actorId, messageId, state });
		const isToggleButton = (component: MessageActionRowComponent): component is ButtonComponent => component.customId === customId;
		const isToggleAction = sageCommand.isSageInteraction("BUTTON") ? sageCommand.interaction.customId === customId : false;
		for (const row of components) {
			for (const component of row.components) {
				if (isToggleButton(component)) {
					if (isToggleAction) {
						return component.emoji?.name === DIE ? "roll" : "edit";
					}
					return component.emoji?.name === DIE ? "edit" : "roll";
				}
			}
		}
	}
	// return sageCommand.args.getString("mode") ?? undefined;
	return "roll";
}

export async function createMacroComponents(sageCommand: SageCommand, args: Args): Promise<ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[]> {

	const components = await createListComponents(sageCommand, args);

	if (!args.macro) return components;

	const { actorId } = sageCommand;
	const localize = sageCommand.getLocalizer();
	const messageId = args.customIdArgs?.messageId;
	const state = args.state.next;
	const mode = getMacroMode(sageCommand, actorId, messageId, state);
	debug({action:args.customIdArgs?.action,mode});
	const buttonArgs = { actorId, localize, messageId, mode, state };

	components.pop();
	const modeButton = createToggleModeButton(buttonArgs);
	const closeButton = createMessageDeleteButton(sageCommand, { label:localize("CLOSE"), style:ButtonStyle.Secondary });

	if (mode === "edit") {
		const newButton = createNewMacroButton(buttonArgs);
		const editButton = createShowEditMacroButton(buttonArgs);
		// const copyButton = createCopyMacroButton(buttonArgs);
		const deleteButton = createDeleteMacroButton(buttonArgs);

		components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(newButton, editButton, deleteButton, modeButton, closeButton));

	}else {
		const rollButton = createRollMacroButton(buttonArgs);
		const showArgsButton = createShowMacroArgsButton(buttonArgs);
		if (!args.macro.hasArgs) showArgsButton.setDisabled(true);

		components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(rollButton, showArgsButton, modeButton, closeButton));

	}

	return components;
}