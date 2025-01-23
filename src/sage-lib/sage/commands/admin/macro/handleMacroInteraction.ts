import { EphemeralMap } from "@rsc-utils/cache-utils";
import { debug, type Snowflake } from "@rsc-utils/core-utils";
import { quote } from "@rsc-utils/string-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalSubmitInteraction, type ButtonInteraction } from "discord.js";
import type { LocalizedTextKey, Localizer } from "../../../../../sage-lang/getLocalizedText.js";
import { Macro, type MacroBase } from "../../../model/Macro.js";
import type { Macros } from "../../../model/Macros.js";
import type { SageInteraction } from "../../../model/SageInteraction.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { parseDiceMatches, sendDice } from "../../dice.js";
import { createMacroArgsModal, createMacroModal } from "./createMacroModal.js";
import { createCustomId, type MacroActionKey } from "./customId.js";
import { getArgPairs, getArgs, type Args, type MacroState } from "./getArgs.js";
import { macroToPrompt } from "./macroToPrompt.js";
import { mCmdDetails } from "./mCmdDetails.js";
import { mCmdList } from "./mCmdList.js";

/** Responds to the Yes/No buttons when prompting to delete a macro. */
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

/** Prompts the user with the details of the macro and Yes/No buttons to confirm deletion. */
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

/** Creates and shows the modal for editing an existing macro. */
async function showEditMacroModal(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<any, any>): Promise<void> {
	// sageInteraction.replyStack.defer();
	const modal = await createMacroModal(sageInteraction, args, "handleEditMacroModal");
	await sageInteraction.interaction.showModal(modal);
}

/** Creates and shows the modal for create a new macro. */
async function showNewMacroModal(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<any, any>): Promise<void> {
	// sageInteraction.replyStack.defer();
	const modal = await createMacroModal(sageInteraction, args, "handleNewMacroModal");
	await sageInteraction.interaction.showModal(modal);
}

/** Rolls the macro in the current channel with no args. */
async function rollMacro(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();
	const macro = args.macro;
	const matches = await parseDiceMatches(sageInteraction, `[${macro.name}]`);
	const outputs = matches.map(m => m.output).flat();
	await sendDice(sageInteraction, outputs);
}

/** Creates and shows the modal for args for rolling a macro. */
async function showMacroArgs(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
	// sageInteraction.replyStack.defer();
	const macro = args.macro;
	const macroArgs = macro.dice?.matchAll(/\{(\w+)(?:\:(\w+))?\}/g) ?? [];
	const argPairs = [...macroArgs].map(match => ({ key:match[1], defaultValue:match[2] }));
	const trailingArgs = macro.dice?.includes("{...}") ?? false;
	const modal = await createMacroArgsModal(args, argPairs, trailingArgs);
	await sageInteraction.interaction.showModal(modal);
}

type MacroArgsForm = { namedPairLines:string; indexedPairLines:string; [key: string]:string|undefined; };

/** Handles the roll macro args modal submission and rolls the macro in the current channel with args. */
async function rollMacroArgs(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();

	let { namedPairLines, indexedPairLines, ...namedPairObj } = sageInteraction.getModalForm<MacroArgsForm>() ?? {};

	const macroArgs: string[] = [];

	// add the named pairs from the single entry fields
	Object.entries(namedPairObj).forEach(([key, value]) => {
		value = value?.trim();
		if (value?.length) {
			macroArgs.push(`${key}=${quote(value)}`);
		}
	});

	// add the named pairs from the multiline entry field
	namedPairLines?.trim().split("\n").forEach(line => {
		line = line.trim();
		const index = line.indexOf("=");
		if (index > -1) {
			const key = line.slice(0, index);
			const value = line.slice(index + 1);
			if (value.length) {
				macroArgs.push(`${key}=${quote(value)}`);
			}
		}
	});

	indexedPairLines?.trim().split("\n").forEach(line => {
		macroArgs.push(quote(line.trim()));
	});

	const macro = args.macro;
	const matches = await parseDiceMatches(sageInteraction, `[${macro.name} ${macroArgs.join(" ")}]`);
	const outputs = matches.map(m => m.output).flat();
	await sendDice(sageInteraction, outputs);
}

export async function handleMacroInteraction(sageInteraction: SageInteraction<any>): Promise<void> {
	const args = await getArgs<any, any>(sageInteraction);
	const action = args.customIdArgs.action;

	switch(action) {
		// case "copyMacro": break;
		case "toggleMacroMode": return mCmdDetails(sageInteraction);
		case "rollMacro": return rollMacro(sageInteraction, args);
		case "showMacroArgs": return showMacroArgs(sageInteraction, args);
		case "rollMacroArgs": return rollMacroArgs(sageInteraction, args);

		case "promptDeleteMacro": return promptDeleteMacro(sageInteraction, args);
		case "confirmDeleteMacro": return handleDeleteMacro(sageInteraction, args);
		case "cancelDeleteMacro": return handleDeleteMacro(sageInteraction, args);

		case "showEditMacroModal": return showEditMacroModal(sageInteraction, args);
		case "handleEditMacroModal": return handleEditMacroModal(sageInteraction, args);
		case "confirmEditMacro": return handleEditMacro(sageInteraction, args);
		case "cancelEditMacro": return handleEditMacro(sageInteraction, args);

		case "showNewMacroModal": return showNewMacroModal(sageInteraction, args);
		case "handleNewMacroModal": return handleNewMacroModal(sageInteraction, args);
		case "confirmNewMacro": return handleNewMacro(sageInteraction, args);
		case "cancelNewMacro": return handleNewMacro(sageInteraction, args);

		default:
			const localize = sageInteraction.getLocalizer();
			return sageInteraction.replyStack.whisper(localize("FEATURE_NOT_IMPLEMENTED"));
	}

}

type InvalidMacroKey = LocalizedTextKey & ("INVALID_MACRO_NAME" | "INVALID_MACRO_DUPLICATE" | "INVALID_MACRO_TABLE" | "INVALID_MACRO_DICE");
async function isInvalid(macros: Macros, macro: Macro, isUpdate: boolean): Promise<InvalidMacroKey | undefined> {
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

async function handleEditMacroModal(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const oldMacro = args.macro;
	const macroBase = sageInteraction.getModalForm<Macro>();
	const hasChanges = oldMacro && macroBase
		&& (macroBase.name !== oldMacro.name || macroBase.category !== oldMacro.category || macroBase.dice !== oldMacro.dice);
	if (hasChanges) {
		const state = args.state.prev;
		const { ownerType, ownerId } = state;

		const newMacro = new Macro(macroBase, { type:ownerType, id:ownerId });

		// validate the macro
		const invalidKey = await isInvalid(args.macros, newMacro, true);
		if (invalidKey) {
			const localize = sageInteraction.getLocalizer();
			await sageInteraction.replyStack.reply(localize(invalidKey));
			return showEditMacroModal(sageInteraction, args);
		}

		await promptEditMacro(sageInteraction, args, { oldMacro, newMacro });

	}else {
		/* edit was canceled or nothing was changed, do nothing */
	}
}

async function promptEditMacro(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>, macroPair: MacroPair): Promise<void> {
	const localize = sageInteraction.getLocalizer();

	const { actorId } = sageInteraction;
	const { messageId } = args.customIdArgs;
	const state = args.state.prev;
	const { oldMacro, newMacro } = macroPair;

	const message = await sageInteraction.interaction.channel?.messages.fetch(args.customIdArgs.messageId!);
	if (message) {
		const cacheKey = createCustomId({ action:"handleEditMacroModal", actorId, messageId, state });
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
}

async function handleEditMacro(sageInteraction: SageInteraction<ModalSubmitInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const { actorId } = sageInteraction;
	const state = args.state.prev;

	// get pair and remove from cache immediately
	const messageId = args.customIdArgs?.messageId ?? (await sageInteraction.fetchMessage())?.id as Snowflake;
	const cacheKey = createCustomId({ action:"handleEditMacroModal", actorId, messageId, state });
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

export async function handleSetMacro(sageMessage: SageMessage): Promise<void> {
	const pairs = getArgPairs(sageMessage);
	debug(pairs);
}

async function handleNewMacroModal(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
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

		// if duplicate, use the edit logic
		if (invalidKey === "INVALID_MACRO_DUPLICATE") {
			const oldMacro = args.macros.find(newMacro.name)!;
			return promptEditMacro(sageInteraction, args, { oldMacro, newMacro });
		}

		// if still invalid, redo modal
		if (invalidKey) {
			await sageInteraction.replyStack.reply(localize(invalidKey));
			return showNewMacroModal(sageInteraction, args);
		}

		// process new as expected
		const message = await sageInteraction.interaction.channel?.messages.fetch(args.customIdArgs?.messageId!);
		if (message) {
			const cacheKey = createCustomId({ action:"handleNewMacroModal", actorId, messageId, state });
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
	const cacheKey = createCustomId({ action:"handleNewMacroModal", messageId, actorId:sageInteraction.actorId, state:state.prev });
	const macro = editCache.get(cacheKey)?.newMacro;
	editCache.delete(cacheKey);

	const isConfirmed = args.customIdArgs?.action === "confirmNewMacro";
	if (isConfirmed) {
		const saved = macro ? await macros.addAndSave(macro) : false;
		if (saved) {
			// update args to have new meta ...
			const { ownerType, ownerPageIndex, ownerId } = args.state.next;
			const { categoryPageIndex = -1, categoryIndex = -1, macroPageIndex = -1, macroIndex = -1 } = args.macros.findMacroMeta(macro?.name!) ?? {};
			args.state.next = { ownerType, ownerPageIndex, ownerId, categoryPageIndex, categoryIndex, macroPageIndex, macroIndex };
			args.macro = macro;

		}else {
			const localize = sageInteraction.getLocalizer();
			// await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
			await sageInteraction.replyStack.reply(localize("SORRY_WE_DONT_KNOW"));
		}

		// return to viewing the macro
		await mCmdDetails(sageInteraction, args as Args<any>);

	}else {
		// return to viewing the category?
		const { ownerType, ownerPageIndex, ownerId } = args.state.prev;
		const { categoryPageIndex, categoryIndex } = args.state.prev;
		args.state.next = { ownerType, ownerPageIndex, ownerId, categoryPageIndex, categoryIndex, macroPageIndex:-1, macroIndex:-1 };
		args.macro = undefined;

		await mCmdList(sageInteraction, args as Args<any>);
	}

}
