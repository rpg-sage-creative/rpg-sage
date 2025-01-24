import { type Snowflake } from "@rsc-utils/core-utils";
import { ModalBuilder } from "@rsc-utils/discord-utils";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createCustomId, type MacroActionKey } from "./customId.js";
import type { Args } from "./getArgs.js";

type MacroArgPair = { key:string; defaultValue?:string; };

/** Creates a modal for passing args to a macro when rolling. */
export async function createMacroArgsModal(args: Args<true, true>, pairs: MacroArgPair[], trailingArgs: boolean): Promise<ModalBuilder> {
	const modal = new ModalBuilder();
	modal.setTitle("Macro Arguments");
	modal.setCustomId(createCustomId({ ...args.customIdArgs, action:"rollMacroArgs" }));

	const namedPairs = pairs.filter(pair => isNaN(+pair.key));
	if (namedPairs.length < 5) {
		namedPairs.forEach(({ key, defaultValue }) => {
			modal.addShortText({ maxLength:80, required:defaultValue===undefined }).setCustomId(key).setLabel(key).setPlaceholder(defaultValue ?? "").setValue(defaultValue ?? "");
		});
	}else {
		const value = namedPairs.map(({ key, defaultValue }) => `${key}=${defaultValue ?? ""}`).join("\n");
		const required = namedPairs.some(({ defaultValue }) => defaultValue === undefined);
		modal.addParagraph({ required }).setCustomId("namedPairLines").setLabel("Type arguments on separate lines: arg=value").setPlaceholder("Type arguments on separate lines: arg=value").setValue(value);
	}

	const indexedPairs = pairs.filter(pair => !namedPairs.includes(pair));
	if (indexedPairs.length || trailingArgs) {
		indexedPairs.sort((a, b) => +a.key - +b.key);
		const value = indexedPairs.map(({ defaultValue }) => `${defaultValue ?? ""}`).join("\n");
		const required = indexedPairs.some(({ defaultValue }) => defaultValue === undefined);
		modal.addParagraph({ required }).setCustomId("indexedPairLines").setLabel("Type arguments on separate lines").setPlaceholder("Type arguments on separate lines").setValue(value);
	}

	return modal;
}

/** Creates a modal for new or existing macros. */
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
	let dialog = "";
	let dice = "";

	if (action === "handleEditMacroModal") {
		name = macro?.name ?? "";
		dialog = macro?.dialog ?? "";
		dice = macro?.dice ?? "";
	}

	const createOrEdit = action === "handleNewMacroModal" ? "CREATE" : "EDIT";
	const macroType = macros.type.toUpperCase();
	const titleKey = `${createOrEdit}_${macroType}_MACRO` as "EDIT_USER_MACRO";
	modal.setTitle(localize(titleKey));

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

	if (macro?.isTable()) {
		modal.addParagraph({ required:true })
			.setCustomId("dice")
			.setLabel(localize("TABLE"))
			.setPlaceholder(localize("MACRO_TABLE_PLACEHOLDER"))
			.setValue(dice);

	}else if (macro?.isItems()) {
		modal.addParagraph({ required:true })
			.setCustomId("dice")
			.setLabel(localize("ITEMS"))
			.setPlaceholder(localize("MACRO_ITEMS_PLACEHOLDER"))
			.setValue(dice);

	}else if (macro?.isDialog()) {
		modal.addParagraph({ required:true })
			.setCustomId("dialog")
			.setLabel(localize("DIALOG"))
			.setPlaceholder(localize("MACRO_DIALOG_PLACEHOLDER"))
			.setValue(dialog);

	}else {
		modal.addParagraph({ required:true })
			.setCustomId("dice")
			.setLabel(localize("DICE"))
			.setPlaceholder(localize("MACRO_DICE_PLACEHOLDER"))
			.setValue(dice);

	}
	return modal;
}