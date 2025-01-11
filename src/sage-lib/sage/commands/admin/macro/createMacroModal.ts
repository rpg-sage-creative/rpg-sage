import { type Snowflake } from "@rsc-utils/core-utils";
import { ModalBuilder } from "@rsc-utils/discord-utils";
import type { SageCommand } from "../../../model/SageCommand.js";
import { type MacroAction } from "./customId.js";
import type { Args } from "./getArgs.js";

export async function createMacroModal(sageCommand: SageCommand, { customIdArgs, owner, macro, selectedCategory }: Args, action: MacroAction): Promise<ModalBuilder> {
	const localize = sageCommand.getLocalizer();

	const modal = new ModalBuilder();
	const message = await sageCommand.fetchMessage(customIdArgs?.messageId);
	const messageId = message?.id as Snowflake;
	const customId = owner.createCustomId({ action, messageId, name:macro?.name, userId:sageCommand.actorId });
	modal.setCustomId(customId);

	let name = "";
	let category = macro?.category ?? selectedCategory ?? "";
	let dice = "";


	const actionType: `${typeof action}|${typeof owner.type}` = `${action}|${owner.type}`;
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