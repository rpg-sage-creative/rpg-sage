import { EphemeralMap } from "@rsc-utils/cache-utils";
import { type Snowflake } from "@rsc-utils/core-utils";
import { quote, ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalSubmitInteraction, type ButtonInteraction } from "discord.js";
import type { LocalizedTextKey, Localizer } from "../../../../../sage-lang/getLocalizedText.js";
import { Macro, type MacroBase } from "../../../model/Macro.js";
import { Macros } from "../../../model/Macros.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { SageInteraction } from "../../../model/SageInteraction.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { parseDiceMatches, sendDice } from "../../dice.js";
import { createMacroArgsModal, createMacroModal } from "./createMacroModal.js";
import { createCustomId, type MacroActionKey } from "./customId.js";
import { getArgPairs, getArgs, isInvalidActorError, type Args, type InteractionArgs, type MacroState } from "./getArgs.js";
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
		content.append(ansiDanger(sageInteraction));

		const components = createYesNoComponents({ actorId, localize, messageId, noAction:"cancelDeleteMacro", state, yesAction:"confirmDeleteMacro" });

		await message.edit(sageInteraction.resolveToOptions({ embeds:content, components }));

	}else {
		await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
	}
}

/**
 * https://gist.github.com/kkrypt0nn/a02506f3712ff2d1c8ca7c9e0aed7c06
	Text Colors

	30: Gray
	31: Red
	32: Green
	33: Yellow
	34: Blue
	35: Pink
	36: Cyan
	37: White
	Background Colors

	40: Firefly dark blue
	41: Orange
	42: Marble blue
	43: Greyish turquoise
	44: Gray
	45: Indigo
	46: Light gray
	47: White
 */
function createColorCode(args?: { backColor?:number; textColor?:number; }): string {
	if (args?.backColor && args?.textColor) {
		return `\u001b[1;${args.backColor};${args.textColor}m`;

	}else if (args?.backColor) {
		return `\u001b[0;${args.backColor}m`;

	}else if (args?.textColor) {
		return `\u001b[1;${args.textColor}m`;

	}else {
		// return the reset code
		return `\u001b[0m`;
	}
}

function ansiText(text: string, colors: { backColor?:number; textColor?:number; }): string {
	const ticks = "```";
	const prefix = createColorCode(colors);
	const suffix = createColorCode();
	return `${ticks}ansi\n${prefix}${text}${suffix}\n${ticks}`;
}

function ansiDanger(sageCommand: SageCommand): string {
	const localizedDanger = sageCommand.getLocalizer()("WARNING_CANNOT_BE_UNDONE");
	return ansiText(localizedDanger, { textColor:31 });
}

/** Prompts the user with the count of all macros and Yes/No buttons to confirm deletion. */
async function promptDeleteAll(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const localize = sageInteraction.getLocalizer();

	const message = await sageInteraction.fetchMessage();
	if (message) {
		const { actorId } = sageInteraction;
		const { messageId } = args.customIdArgs;
		const state = args.state.prev;

		const content = sageInteraction.createAdminRenderable();
		content.append(`<h3>${localize("DELETE_ALL_X_MACROS_?", args.macros.size)}</h3>`);
		content.append(ansiDanger(sageInteraction));

		const components = createYesNoComponents({ actorId, localize, messageId, noAction:"cancelDeleteAll", state, yesAction:"confirmDeleteAll" });

		await message.edit(sageInteraction.resolveToOptions({ embeds:content, components }));

	}else {
		await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
	}
}

/** Responds to the Yes/No buttons when prompting to delete all macros. */
async function handleDeleteAll(sageInteraction: SageInteraction<ButtonInteraction>, { customIdArgs, macros }: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const isConfirmed = customIdArgs.action === "confirmDeleteAll";
	if (isConfirmed) {
		const deleted = await macros.removeAllAndSave();
		if (deleted) {
			return mCmdList(sageInteraction);
		}else {
			const localize = sageInteraction.getLocalizer();
			await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
		}
	}
	await mCmdList(sageInteraction);
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
	const modal = await createMacroArgsModal(args);
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

async function resetControl(sageInteraction: SageInteraction<ButtonInteraction>, args: Args): Promise<void> {
	await sageInteraction.replyStack.defer();

	// return to selecting the macro type / owner
	args.state.next = { ownerType:undefined, ownerPageIndex:-1, ownerId:undefined, categoryPageIndex:-1, categoryIndex:-1, macroPageIndex:-1, macroIndex:-1 };
	args.macro = undefined;
	await mCmdList(sageInteraction, args as Args<any>);
}

export async function handleMacroInteraction(sageInteraction: SageInteraction<any>): Promise<void> {
	// get the args
	let args: InteractionArgs<any, any> | undefined;
	try {
		args = await getArgs(sageInteraction);

	}catch(ex) {
		const localize = sageInteraction.getLocalizer();
		// gracefully handle errors trying to get the args
		if (isInvalidActorError(ex)) {
			await sageInteraction.user.send(localize("PLEASE_DONT_USE_CONTROLS"));
		}else {
			await sageInteraction.replyStack.send(localize("SORRY_WE_DONT_KNOW"));
		}
		return;
	}

	const action = args.customIdArgs.action;

	switch(action) {
		// case "copyMacro": break;
		case "rollMacro": return rollMacro(sageInteraction, args);
		case "showMacroArgs": return showMacroArgs(sageInteraction, args);
		case "rollMacroArgs": return rollMacroArgs(sageInteraction, args);

		case "promptDeleteMacro": return promptDeleteMacro(sageInteraction, args);
		case "confirmDeleteMacro":
		case "cancelDeleteMacro": return handleDeleteMacro(sageInteraction, args);

		case "promptDeleteAll": return promptDeleteAll(sageInteraction, args);
		case "confirmDeleteAll":
		case "cancelDeleteAll": return handleDeleteAll(sageInteraction, args);

		case "showEditMacroModal": return showEditMacroModal(sageInteraction, args);
		case "handleEditMacroModal": return handleEditMacroModal(sageInteraction, args);
		case "confirmEditMacro":
		case "cancelEditMacro": return handleEditMacro(sageInteraction, args);

		case "showNewMacroModal": return showNewMacroModal(sageInteraction, args);
		case "handleNewMacroModal": return handleNewMacroModal(sageInteraction, args);
		case "confirmNewMacro":
		case "cancelNewMacro": return handleNewMacro(sageInteraction, args);

		case "showRollButtons":
		case "showEditButtons":
		case "showOtherButtons":
			await sageInteraction.replyStack.defer();
			return args.macro ? mCmdDetails(sageInteraction, args) : mCmdList(sageInteraction, args);

		case "resetControl": return resetControl(sageInteraction, args);

		default:
			const localize = sageInteraction.getLocalizer();
			return sageInteraction.replyStack.whisper(localize("FEATURE_NOT_IMPLEMENTED"));
	}

}

type InvalidMacroKey = LocalizedTextKey & ("INVALID_MACRO_NAME" | "INVALID_MACRO_DUPLICATE" | "INVALID_MACRO_TABLE" | "INVALID_MACRO_DICE" | "INVALID_MACRO_DIALOG");
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
		if (macro.isDialog()) return "INVALID_MACRO_DIALOG";
		if (macro.isType("table", "tableUrl")) return "INVALID_MACRO_TABLE";
		return "INVALID_MACRO_DICE";
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
			await sageInteraction.replyStack.reply(`${localize(invalidKey)} ${localize("MACROS_WIKI")}`);
			return showEditMacroModal(sageInteraction, args);
		}

		await promptEditMacro(sageInteraction, args, { oldMacro, newMacro });

	}else {
		/* edit was canceled or nothing was changed, do nothing */
	}
}

async function promptEditMacro(sageCommand: SageCommand, args: Args<true, true>, macroPair: MacroPair): Promise<void> {
	const localize = sageCommand.getLocalizer();

	const { actorId } = sageCommand;
	const { messageId } = args.customIdArgs;
	const state = args.state.prev;
	const { oldMacro, newMacro } = macroPair;

	const message = await sageCommand.fetchMessage(messageId);
	if (message) {
		const cacheKey = createCustomId({ action:"handleEditMacroModal", actorId, messageId, state });
		editCache.set(cacheKey, { oldMacro, newMacro });

		const existingPrompt = macroToPrompt(sageCommand, oldMacro);
		const updatedPrompt = macroToPrompt(sageCommand, newMacro, { usage:true });

		const content = sageCommand.createAdminRenderable("UPDATE_MACRO_?");
		content.append(`${localize("FROM")}:${existingPrompt}\n${localize("TO")}:${updatedPrompt}`);

		const components = createYesNoComponents({ actorId, localize, messageId, noAction:"cancelEditMacro", state, yesAction:"confirmEditMacro" });

		await message.edit(sageCommand.resolveToOptions({ content:ZERO_WIDTH_SPACE, embeds:content, components }));

	}else {
		await sageCommand.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
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

	if (args.macro) {
		// return to viewing the macro
		await mCmdDetails(sageInteraction, args as Args<any, any>);

	}else {
		// return to category list
		await mCmdList(sageInteraction, args as Args<any, any>);
	}
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
	const localize = sageMessage.getLocalizer();

	const pairs = getArgPairs(sageMessage);

	const name = pairs.namePair?.value;
	const category = pairs.categoryPair?.value;
	const dialog = pairs.contentPair?.key === "dialog" ? pairs.contentPair.value : undefined;
	const dice = pairs.contentPair?.key !== "dialog" ? pairs.contentPair?.value : undefined;

	if (!name || (!dialog && !dice)) {
		return sageMessage.replyStack.whisper(`${localize("SORRY_WE_DONT_KNOW")} ${localize("MACROS_WIKI")}`);
	}

	const ownerType = "user";
	const ownerId = sageMessage.actorId;

	const newMacro = new Macro({ name, category, dialog, dice }, { type:ownerType, id:ownerId });

	// validate the macro
	const macros = await Macros.parse(sageMessage, newMacro.owner);
	if (!macros) {
		return sageMessage.replyStack.whisper(`${localize("SORRY_WE_DONT_KNOW")} ${localize("MACROS_WIKI")}`);
	}

	const message = await sageMessage.replyStack.send(localize("PLEASE_WAIT"), true);

	const args = {
		customIdArgs: { messageId: message?.id },
		state: { prev:{ ownerType, ownerPageIndex:-1, ownerId, categoryPageIndex:-1, categoryIndex:-1, macroPageIndex:-1, macroIndex:-1 } }
	} as Args<any, any>;

	// if duplicate, use the edit logic
	const invalidKey = await isInvalid(macros, newMacro, false);
	if (invalidKey === "INVALID_MACRO_DUPLICATE") {
		const oldMacro = macros.find(newMacro.name)!;
		return promptEditMacro(sageMessage, args, { oldMacro, newMacro });
	}

	return promptNewMacro(sageMessage, args, newMacro);
}

async function handleNewMacroModal(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true, true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const macroBase = sageInteraction.getModalForm<MacroBase>();
	if (macroBase) {
		const localize = sageInteraction.getLocalizer();

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
			await sageInteraction.replyStack.reply(`${localize(invalidKey)} ${localize("MACROS_WIKI")}`);
			return showNewMacroModal(sageInteraction, args);
		}

		// process new as expected
		await promptNewMacro(sageInteraction, args, newMacro);

	}else {
		/* edit was canceled or nothing was changed, do nothing */
	}
}

async function promptNewMacro(sageCommand: SageCommand, args: Args<true, true>, newMacro: Macro): Promise<void> {
	const localize = sageCommand.getLocalizer();

	const { actorId } = sageCommand;
	const { messageId } = args.customIdArgs;
	const state = args.state.prev;

	const message = await sageCommand.fetchMessage(messageId);
	if (message) {
		const cacheKey = createCustomId({ action:"handleNewMacroModal", actorId, messageId, state });
		editCache.set(cacheKey, { newMacro });

		const content = sageCommand.createAdminRenderable("CREATE_MACRO_?");
		content.append(macroToPrompt(sageCommand, newMacro, { usage:true }));

		const components = createYesNoComponents({ actorId, localize, messageId, noAction:"cancelNewMacro", state, yesAction:"confirmNewMacro" });

		await message.edit(sageCommand.resolveToOptions({ content:ZERO_WIDTH_SPACE, embeds:content, components }));

	}else {
		await sageCommand.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
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
