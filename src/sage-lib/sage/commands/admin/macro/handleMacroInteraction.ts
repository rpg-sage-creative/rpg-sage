import { EphemeralMap } from "@rsc-utils/cache-utils";
import { debug, type Snowflake } from "@rsc-utils/core-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalSubmitInteraction, type ButtonInteraction } from "discord.js";
import type { LocalizedTextKey, Localizer } from "../../../../../sage-lang/getLocalizedText.js";
import { Macro, type MacroBase } from "../../../model/Macro.js";
import type { Macros } from "../../../model/Macros.js";
import type { SageInteraction } from "../../../model/SageInteraction.js";
import { parseDiceMatches, sendDice } from "../../dice.js";
import { createMacroArgsModal, createMacroModal } from "./createMacroModal.js";
import { createCustomId, type MacroActionKey } from "./customId.js";
import { getArgs, type Args, type MacroState } from "./getArgs.js";
import { macroToPrompt } from "./macroToPrompt.js";
import { mCmdDetails } from "./mCmdDetails.js";
import { mCmdList } from "./mCmdList.js";

async function handleDeleteMacro(sageInteraction: SageInteraction<ButtonInteraction>, { customIdArgs, macros, macro }: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const isConfirmed = customIdArgs.action === "confirmDeleteMacro";
	if (isConfirmed) {
		const deleted = await macros.removeAndSave(macro);
		if (deleted) {
			return mCmdList(sageInteraction);
		}else {
			const localize = sageInteraction.getLocalizer();
			await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
		}
	}
	await mCmdDetails(sageInteraction);
}

async function promptDeleteMacro(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const localize = sageInteraction.getLocalizer();

	const message = await sageInteraction.fetchMessage();
	if (message) {
		const { actorId } = sageInteraction;
		const { messageId } = args.customIdArgs;
		const state = args.state.prev;

		const content = sageInteraction.createAdminRenderable();
		content.append(`<h3>${localize("DELETE_MACRO_?")}</h3>`);
		content.append(`<h2>${args.macro.name}</h2>`);

		const components = createYesNoComponents({ actorId, localize, messageId, noAction:"cancelDeleteMacro", state, yesAction:"confirmDeleteMacro" });

		await message.edit(sageInteraction.resolveToOptions({ embeds:content, components }));

	}else {
		await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
	}
}

async function showEditMacro(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<any>): Promise<void> {
	const modal = await createMacroModal(sageInteraction, args, "promptEditMacro");
	await sageInteraction.interaction.showModal(modal);
}

async function showNewMacro(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<any, any>): Promise<void> {
	const modal = await createMacroModal(sageInteraction, args, "promptNewMacro");
	await sageInteraction.interaction.showModal(modal);
}

async function rollMacro(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();
	const macro = args.macro;
	const matches = await parseDiceMatches(sageInteraction, `[${macro.name}]`);
	const outputs = matches.map(m => m.output).flat();
	await sendDice(sageInteraction, outputs);
}

async function showMacroArgs(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();
	const macro = args.macro;
	const macroArgs = macro.dice.matchAll(/\{(\w+)(?:\:(\w+))?\}/g) ?? [];
	const argPairs = [...macroArgs].map(match => ({ key:match[1], defaultValue:match[2] }));
	const trailingArgs = macro.dice.includes("{...}");
	const modal = await createMacroArgsModal(args, argPairs, trailingArgs);
	await sageInteraction.interaction.showModal(modal);
	debug("showMacroArgs:sent");
}

async function rollMacroArgs(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const macroArgs = sageInteraction.getModalForm<MacroBase>();
	debug({macro:args.macro.dice,macroArgs});
}

export async function handleMacroInteraction(sageInteraction: SageInteraction<any>): Promise<void> {
	// sageInteraction.replyStack.defer();

	const args = await getArgs<any, any>(sageInteraction);
	const action = args.customIdArgs.action;

	// if (action !== "showNewMacro" && action !== "promptNewMacro" && !args.macro) {
	// 	debug({customId:sageInteraction.interaction.customId});
	// 	const localize = sageInteraction.getLocalizer();
	// 	return sageInteraction.replyStack.whisper(localize("CANNOT_FIND_S", args.selectedMacro));
	// }

	switch(action) {
		// case "copyMacro": break;
		case "toggleMacroMode": return mCmdDetails(sageInteraction);
		case "rollMacro": return rollMacro(sageInteraction, args);
		case "showMacroArgs": return showMacroArgs(sageInteraction, args);
		case "rollMacroArgs": return rollMacroArgs(sageInteraction, args);

		case "promptDeleteMacro": return promptDeleteMacro(sageInteraction, args);
		case "confirmDeleteMacro": return handleDeleteMacro(sageInteraction, args);
		case "cancelDeleteMacro": return handleDeleteMacro(sageInteraction, args);

		case "showEditMacro": return showEditMacro(sageInteraction, args);
		case "promptEditMacro": return promptEditMacro(sageInteraction, args);
		case "confirmEditMacro": return handleEditMacro(sageInteraction, args);
		case "cancelEditMacro": return handleEditMacro(sageInteraction, args);

		case "showNewMacro": return showNewMacro(sageInteraction, args);
		case "promptNewMacro": return promptNewMacro(sageInteraction, args);
		case "confirmNewMacro": return handleNewMacro(sageInteraction, args);
		case "cancelNewMacro": return handleNewMacro(sageInteraction, args);

		default:
			const localize = sageInteraction.getLocalizer();
			return sageInteraction.replyStack.whisper(localize("FEATURE_NOT_IMPLEMENTED"));
	}

}

async function isInvalid(macros: Macros, macro: Macro, isUpdate: boolean): Promise<LocalizedTextKey | undefined> {
	// validate name
	const isValidName = /^[\w -]+$/.test(macro.name);
	if (!isValidName) {
		return "INVALID_MACRO_NAME";
	}

	// validate uniqueness
	if (!isUpdate && macros.hasMacro(macro.name)) {
		return "INVALID_MACRO_DUPLICATE";
	}

	// validate dice
	const isValidDice = await Macro.validateMacro(macro);
	if (!isValidDice) {
		return macro.type === "table" || macro.type === "tableUrl" ? "INVALID_MACRO_TABLE" : "INVALID_MACRO_DICE";
	}
	return undefined;
}

type MacroSinglet = { oldMacro?:Macro, newMacro:Macro };
type MacroPair = { oldMacro:Macro, newMacro:Macro };
const editCache = new EphemeralMap<string, MacroSinglet | MacroPair>(60 * 1000);
// const editCache = new Map<string, { oldMacro:Macro, newMacro:Macro }>();

async function promptEditMacro(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const oldMacro = args.macro;
	const macroBase = sageInteraction.getModalForm<Macro>();
	const hasChanges = oldMacro && macroBase
		&& (macroBase.name !== oldMacro.name || macroBase.category !== oldMacro.category || macroBase.dice !== oldMacro.dice);
	if (hasChanges) {
		const localize = sageInteraction.getLocalizer();

		const { actorId } = sageInteraction;
		const { messageId } = args.customIdArgs;
		const state = args.state.prev;
		const { ownerType, ownerId } = state;

		const newMacro = new Macro(macroBase, { type:ownerType, id:ownerId });

		// validate the macro
		const invalidKey = await isInvalid(args.macros, newMacro, true);
		if (invalidKey) {
			await sageInteraction.replyStack.reply(localize(invalidKey));
			return showNewMacro(sageInteraction, args);
		}

		const message = await sageInteraction.interaction.channel?.messages.fetch(args.customIdArgs.messageId!);
		if (message) {
			const cacheKey = createCustomId({ action:"promptEditMacro", actorId, messageId, state });
			editCache.set(cacheKey, { oldMacro, newMacro });

			const existingPrompt = macroToPrompt(sageInteraction, oldMacro);
			const updatedPrompt = macroToPrompt(sageInteraction, newMacro, { usage:true });

			const content = sageInteraction.createAdminRenderable("UPDATE_MACRO_?");
			content.append(`${localize("FROM")}:${existingPrompt}\n${localize("TO")}:${updatedPrompt}`);

			const components = createYesNoComponents({ actorId, localize, messageId, noAction:"cancelEditMacro", state, yesAction:"confirmEditMacro" });

			await message.edit(sageInteraction.resolveToOptions({ embeds:content, components }));

		}else {
			await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
		}

	}else {
		/* edit was canceled or nothing was changed, do nothing */
	}
}

async function handleEditMacro(sageInteraction: SageInteraction<ModalSubmitInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const { actorId } = sageInteraction;
	const state = args.state.prev;

	// get pair and remove from cache immediately
	const messageId = args.customIdArgs?.messageId ?? (await sageInteraction.fetchMessage())?.id as Snowflake;
	const cacheKey = createCustomId({ action:"promptEditMacro", actorId, messageId, state });
	const macroPair = editCache.get(cacheKey);
	editCache.delete(cacheKey);

	const isConfirmed = args.customIdArgs.action === "confirmEditMacro";
	if (isConfirmed) {
		const saved = macroPair?.oldMacro ? await args.macros.updateAndSave(macroPair as MacroPair) : false;
		if (saved) {
			// update args to have new meta ...
			const { ownerType, ownerPageIndex, ownerId } = args.state.next;
			const { categoryPageIndex = -1, categoryIndex = -1, macroPageIndex = -1, macroIndex = -1 } = args.macros.findMacroMeta(macroPair?.newMacro.name!) ?? {};
			args.state.next = { ownerType, ownerPageIndex, ownerId, categoryPageIndex, categoryIndex, macroPageIndex, macroIndex };
			args.macro = macroPair?.newMacro!;

		}else {
			const localize = sageInteraction.getLocalizer();
			// await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
			await sageInteraction.replyStack.reply(localize("SORRY_WE_DONT_KNOW"));
		}
	}

	// return to viewing the macro
	await mCmdDetails(sageInteraction, args as Args<any, any>);
}

type YesNoArgs = {
	actorId: Snowflake;
	localize: Localizer;
	messageId?: Snowflake;
	noAction: MacroActionKey;
	state: MacroState<true>;
	yesAction: MacroActionKey;
};
function createYesNoComponents(args: YesNoArgs): ActionRowBuilder<ButtonBuilder>[] {
	const { actorId, localize, messageId, noAction, state, yesAction } = args;

	const button = (action: MacroActionKey, yesNo: "YES" | "NO") => new ButtonBuilder()
		.setCustomId(createCustomId({ action, actorId, messageId, state }))
		.setLabel(localize(yesNo))
		.setStyle(yesNo === "YES" ? ButtonStyle.Success : ButtonStyle.Secondary);

	const yes = button(yesAction, "YES");
	const no = button(noAction, "NO");
	return [new ActionRowBuilder<ButtonBuilder>().addComponents(yes, no)];
}

async function promptNewMacro(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const macroBase = sageInteraction.getModalForm<MacroBase>();
	if (macroBase) {
		const localize = sageInteraction.getLocalizer();

		const { actorId } = sageInteraction;
		const { messageId } = args.customIdArgs;
		const state = args.state.prev;
		const { ownerType, ownerId } = state;

		const newMacro = new Macro(macroBase, { type:ownerType, id:ownerId });

		// validate the macro
		const invalidKey = await isInvalid(args.macros, newMacro, false);
		if (invalidKey) {
			await sageInteraction.replyStack.reply(localize(invalidKey));
			return showNewMacro(sageInteraction, args);
		}

		const message = await sageInteraction.interaction.channel?.messages.fetch(args.customIdArgs?.messageId!);
		if (message) {
			const cacheKey = createCustomId({ action:"promptNewMacro", actorId, messageId, state });
			editCache.set(cacheKey, { newMacro });

			const content = sageInteraction.createAdminRenderable("CREATE_MACRO_?");
			content.append(macroToPrompt(sageInteraction, newMacro, { usage:true }));

			const components = createYesNoComponents({ actorId, localize, messageId, noAction:"cancelNewMacro", state, yesAction:"confirmNewMacro" });

			await message.edit(sageInteraction.resolveToOptions({ embeds:content, components }));

		}else {
			await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
		}

	}else {
		/* edit was canceled or nothing was changed, do nothing */
	}
}

async function handleNewMacro(sageInteraction: SageInteraction<ModalSubmitInteraction>, args: Args<true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const { macros, state } = args;

	// get pair and remove from cache immediately
	const messageId = args.customIdArgs?.messageId ?? (await sageInteraction.fetchMessage())?.id as Snowflake;
	const cacheKey = createCustomId({ action:"promptNewMacro", messageId, actorId:sageInteraction.actorId, state:state.prev });
	const macro = editCache.get(cacheKey)?.newMacro;
	editCache.delete(cacheKey);

	const isConfirmed = args.customIdArgs?.action === "confirmNewMacro";
	if (isConfirmed) {
		const saved = macro ? await macros.addAndSave(macro) : false;
		if (!saved) {
			const localize = sageInteraction.getLocalizer();
			// await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
			await sageInteraction.replyStack.reply(localize("SORRY_WE_DONT_KNOW"));
		}

		// return to viewing the macro
		await mCmdDetails(sageInteraction);

	}else {
		// return to viewing the category?
	}

}
