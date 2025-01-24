import { type Snowflake } from "@rsc-utils/core-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonStyle, StringSelectMenuBuilder, type MessageActionRowComponent } from "discord.js";
import type { Localizer } from "../../../../../sage-lang/getLocalizedText.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createMessageDeleteButton } from "../../../model/utils/deleteButton.js";
import { createListComponents } from "./createListComponents.js";
import { createCustomId } from "./customId.js";
import type { Args, MacroState } from "./getArgs.js";

type DIE = "🎲";
const DIE: DIE = "🎲";

type GEAR = "⚙️";
const GEAR: GEAR = "⚙️";

type CreateArgs = {
	actorId: Snowflake;
	localize: Localizer;
	messageId?: Snowflake;
	mode: "edit" | "roll";
	state: MacroState;
};

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

function createToggleModeButton({ actorId, messageId, mode, state }: CreateArgs): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId({ action:"toggleMacroMode", actorId, messageId, state }))
		.setStyle(ButtonStyle.Secondary)
		.setEmoji(mode === "edit" ? DIE : GEAR)
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
	const buttonArgs = { actorId, localize, messageId, mode, state };

	components.pop();

	const row = new ActionRowBuilder<ButtonBuilder>();

	const canEdit = args.macros?.canActorEdit(sageCommand);

	if (mode === "edit" && canEdit) {
		row.addComponents(
			createNewMacroButton(buttonArgs),
			createShowEditMacroModalButton(buttonArgs),
			createDeleteMacroButton(buttonArgs),
			createToggleModeButton(buttonArgs)
		);

	}else {
		row.addComponents(
			createRollMacroButton(buttonArgs),
			createShowMacroArgsButton(buttonArgs, !args.macro.hasArgs)
		);
		if (canEdit) {
			row.addComponents(
				createToggleModeButton(buttonArgs)
			);
		}
		row.addComponents(
			createMessageDeleteButton(sageCommand, { label:localize("CLOSE"), style:ButtonStyle.Secondary })
		);

	}

	components.push(row);

	return components;
}