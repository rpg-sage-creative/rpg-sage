import { type Snowflake } from "@rsc-utils/core-utils";
import { ModalBuilder } from "@rsc-utils/discord-utils";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createCustomId, type MacroActionKey } from "./customId.js";
import type { Args } from "./getArgs.js";
import type { MacroOwnerTypeKey } from "./Owner.js";

export async function createMacroModal(sageCommand: SageCommand, args: Args<true>, action: MacroActionKey): Promise<ModalBuilder> {
	const localize = sageCommand.getLocalizer();

	const { actorId } = sageCommand;
	const { macro, macros } = args;
	const state = args.state.prev;

	const modal = new ModalBuilder();
	const message = await sageCommand.fetchMessage(args.customIdArgs?.messageId);
	const messageId = message?.id as Snowflake;
	modal.setCustomId(createCustomId({ action, actorId, messageId, state }));

	let name = "";
	let category = macro?.category ?? macros.getCategory(state) ?? "";
	let dice = "";


	const actionType: `${typeof action}|${MacroOwnerTypeKey}` = `${action}|${macros.type}`;
	switch(actionType) {
		case "promptNewMacro|user":
			modal.setTitle(localize("CREATE_USER_MACRO"));
			break;
		case "promptEditMacro|user":
		default:
			name = macro?.name ?? "";
			dice = macro?.dice ?? "";
			modal.setTitle(localize("EDIT_USER_MACRO"));
			break;
	}

	modal.addShortText({ maxLength:80, required:true })
		.setCustomId("name")
		.setLabel(localize("NAME"))
		.setPlaceholder(localize("MACRO_NAME_PLACEHOLDER"))
		.setValue(name);

	modal.addShortText({ maxLength:80 })
		.setCustomId("category")
		.setLabel(localize("CATEGORY"))
		.setPlaceholder(localize("MACRO_CATEGORY_PLACEHOLDER"))
		.setValue(category);

	if (macro?.type === "table") {
		modal.addParagraph({ required:true })
			.setCustomId("table")
			.setLabel(localize("TABLE"))
			.setPlaceholder(localize("MACRO_TABLE_PLACEHOLDER"))
			.setValue(dice);

	}else if (macro?.type === "items") {
		modal.addParagraph({ required:true })
			.setCustomId("items")
			.setLabel(localize("ITEMS"))
			.setPlaceholder(localize("MACRO_ITEMS_PLACEHOLDER"))
			.setValue(dice);

	}else {
		modal.addParagraph({ required:true })
			.setCustomId("dice")
			.setLabel(localize("DICE"))
			.setPlaceholder(localize("MACRO_DICE_PLACEHOLDER"))
			.setValue(dice);

	}
	return modal;
}