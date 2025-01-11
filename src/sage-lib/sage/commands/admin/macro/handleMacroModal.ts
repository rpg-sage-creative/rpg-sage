import { EphemeralMap } from "@rsc-utils/cache-utils";
import { type Snowflake } from "@rsc-utils/core-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, type ModalSubmitInteraction } from "discord.js";
import type { SageInteraction } from "../../../model/SageInteraction.js";
import { parseCustomId, type MacroAction } from "./customId.js";
import { getArgs, type Args } from "./getArgs.js";
import { getMacroType } from "./getMacroType.js";
import type { Macro } from "./HasMacros.js";
import { macroToPrompt } from "./macroToPrompt.js";
import { mCmdDetails } from "./mCmdDetails.js";

const editCache = new EphemeralMap<string, { oldMacro:Macro, newMacro:Macro }>(60 * 1000);
// const editCache = new Map<string, { oldMacro:Macro, newMacro:Macro }>();

export async function handleEditMacro(sageInteraction: SageInteraction<ButtonInteraction>, args: Args<true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const { owner, macro } = args;

	// get pair and remove from cache immediately
	const messageId = args.customIdArgs?.messageId ?? (await sageInteraction.fetchMessage())?.id as Snowflake;
	const cacheKey = owner.createCustomId({ action:"promptEditMacro", messageId, name:macro.name, userId:sageInteraction.actorId });
	const macroPair = editCache.get(cacheKey);
	editCache.delete(cacheKey);

	const isConfirmed = sageInteraction.customIdMatches(/confirmEditMacro/);
	if (isConfirmed) {
		const saved = macroPair ? await owner.updateAndSave(macroPair) : false;
		if (!saved) {
			const localize = sageInteraction.getLocalizer();
			// await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
			await sageInteraction.replyStack.reply(localize("SORRY_WE_DONT_KNOW"));
		}
	}

	// return to viewing the macro
	await mCmdDetails(sageInteraction);
}

async function promptEditMacro(sageInteraction: SageInteraction<ModalSubmitInteraction>, { customIdArgs, owner, macro }: Args<true>): Promise<void> {
	sageInteraction.replyStack.defer();

	const newMacro = sageInteraction.getModalForm<Macro>();
	const hasChanges = newMacro && macro
		&& (newMacro.name !== macro.name || newMacro.category !== macro.category || newMacro.dice !== macro.dice);
	if (hasChanges) {
		const localize = sageInteraction.getLocalizer();

		// form doesn't include ownerId, ownerType, or type
		newMacro.ownerId = owner.id;
		newMacro.ownerType = owner.type;
		newMacro.type = getMacroType(newMacro.dice);

		const cacheKey = sageInteraction.interaction.customId;
		editCache.set(cacheKey, { oldMacro:macro, newMacro });

		const existingPrompt = macroToPrompt(sageInteraction, macro);
		const updatedPrompt = macroToPrompt(sageInteraction, newMacro, { usage:true });

		const content = sageInteraction.createAdminRenderable("UPDATE_MACRO_?");
		content.append(`${localize("FROM")}:${existingPrompt}\n${localize("TO")}:${updatedPrompt}`);

		const customId = (action: MacroAction) => owner.createCustomId({ action, name:macro.name, userId:sageInteraction.actorId });

		const yes = new ButtonBuilder().setCustomId(customId("confirmEditMacro")).setLabel("Yes").setStyle(ButtonStyle.Success);
		const no = new ButtonBuilder().setCustomId(customId("cancelEditMacro")).setLabel("No").setStyle(ButtonStyle.Secondary);
		const components = [new ActionRowBuilder<ButtonBuilder>().addComponents(yes, no)];

		const message = await sageInteraction.interaction.channel?.messages.fetch(customIdArgs.messageId!);
		if (message) {
			await message.edit(sageInteraction.resolveToOptions({ embeds:content, components }));
		}else {
			await sageInteraction.replyStack.whisper(localize("SORRY_WE_DONT_KNOW"));
		}

	}else {
		/* edit was canceled or nothing was changed, do nothing */
	}
}

export async function handleMacroModal(sageInteraction: SageInteraction<ModalSubmitInteraction>): Promise<void> {
	// sageInteraction.replyStack.defer();

	const customIdArgs = sageInteraction.parseCustomId(parseCustomId)!;

	const args = await getArgs<true>(sageInteraction);
	if (!args.macro) {
		const localize = sageInteraction.getLocalizer();
		return sageInteraction.replyStack.whisper(localize("CANNOT_FIND_S", args.selectedMacro));
	}

	switch(customIdArgs.action) {
		case "promptEditMacro": return promptEditMacro(sageInteraction, args);
		default:
			const localize = sageInteraction.getLocalizer();
			return sageInteraction.replyStack.whisper(localize("FEATURE_NOT_IMPLEMENTED"));
	}

}