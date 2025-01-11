import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type ButtonInteraction } from "discord.js";
import type { SageInteraction } from "../../../model/SageInteraction.js";
import { createMacroModal } from "../macro/createMacroModal.js";
import { createCustomId, type MacroAction } from "./customId.js";
import { getArgs, type Args } from "./getArgs.js";
import { handleEditMacro } from "./handleMacroModal.js";
import { mCmdDetails } from "./mCmdDetails.js";
import { mCmdList } from "./mCmdList.js";

async function handleDeleteMacro(sageInteraction: SageInteraction<ButtonInteraction>, { owner, macro }: Args<true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const isConfirmed = sageInteraction.customIdMatches(/confirmDeleteMacro/);
	if (isConfirmed) {
		const deleted = await owner.removeAndSave(macro);
		if (deleted) {
			return mCmdList(sageInteraction);
		}else {
			const localize = sageInteraction.getLocalizer();
			await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
		}
	}
	await mCmdDetails(sageInteraction);
}

async function promptDeleteMacro(sageInteraction: SageInteraction<ButtonInteraction>, { owner, macro }: Args<true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const localize = sageInteraction.getLocalizer();

	const content = sageInteraction.createAdminRenderable();
	content.append(`<h3>${localize("DELETE_MACRO_?")}</h3>`);
	content.append(`<h2>${macro.name}</h2>`);

	const customId = (action: MacroAction) => createCustomId({ action, name:macro.name, ownerId:owner.id, type:owner.type, userId:sageInteraction.actorId });

	const yes = new ButtonBuilder().setCustomId(customId("confirmDeleteMacro")).setLabel("Yes").setStyle(ButtonStyle.Danger);
	const no = new ButtonBuilder().setCustomId(customId("cancelDeleteMacro")).setLabel("No").setStyle(ButtonStyle.Secondary);
	const components = [new ActionRowBuilder<ButtonBuilder>().addComponents(yes, no)];

	const message = await sageInteraction.fetchMessage();
	if (message) {
		await message.edit(sageInteraction.resolveToOptions({ embeds:content, components }));
	}
}

async function showEditMacro(sageInteraction: SageInteraction<ButtonInteraction>, args: Args): Promise<void> {
	const modal = await createMacroModal(sageInteraction, args, "promptEditMacro");
	await sageInteraction.interaction.showModal(modal);
}

async function showNewMacro(sageInteraction: SageInteraction<ButtonInteraction>, args: Args): Promise<void> {
	const modal = await createMacroModal(sageInteraction, args, "promptNewMacro");
	await sageInteraction.interaction.showModal(modal);
}

export async function handleMacroButton(sageInteraction: SageInteraction<ButtonInteraction>): Promise<void> {
	// sageInteraction.replyStack.defer();

	const args = await getArgs(sageInteraction);
	const action = args.customIdArgs.action;

	if (action !== "showNewMacro" && !args.macro) {
		const localize = sageInteraction.getLocalizer();
		return sageInteraction.replyStack.whisper(localize("CANNOT_FIND_S", args.selectedMacro));
	}

	switch(args.customIdArgs.action) {
		case "copyMacro": break;

		case "promptDeleteMacro": return promptDeleteMacro(sageInteraction, args as Args<true>);
		case "confirmDeleteMacro": return handleDeleteMacro(sageInteraction, args as Args<true>);
		case "cancelDeleteMacro": return handleDeleteMacro(sageInteraction, args as Args<true>);

		case "showEditMacro": return showEditMacro(sageInteraction, args);
		case "confirmEditMacro": return handleEditMacro(sageInteraction, args as Args<true>);
		case "cancelEditMacro": return handleEditMacro(sageInteraction, args as Args<true>);

		case "showNewMacro": return showNewMacro(sageInteraction, args);

		default:
			const localize = sageInteraction.getLocalizer();
			return sageInteraction.replyStack.whisper(localize("FEATURE_NOT_IMPLEMENTED"));
	}

}