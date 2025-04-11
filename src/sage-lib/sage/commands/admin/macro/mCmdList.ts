import { partition } from "@rsc-utils/array-utils";
import { DiscordMaxValues, toUserMention } from "@rsc-utils/discord-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { StringSelectMenuInteraction } from "discord.js";
import type { Macro } from "../../../model/Macro.js";
import { MacroOwner } from "../../../model/MacroOwner.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { SageInteraction } from "../../../model/SageInteraction.js";
import { createListComponents } from "./createListComponents.js";
import { getArgs, isInvalidActorError, type Args, type InteractionArgs } from "./getArgs.js";
import { mCmdDetails } from "./mCmdDetails.js";

function toList(macros: Macro[]): string {
	const listItems = macros.map(macro => {
		if (macro.type !== "dice") {
			return `<li>${macro.name} <i>(${macro.type})</i></li>`;
		}
		return `<li>${macro.name}</li>`;
	});
	return `<ul>${listItems.join("")}</ul>`;
}

async function toRenderableContent(sageCommand: SageCommand, args: Args): Promise<RenderableContent> {
	const localize = sageCommand.getLocalizer();

	const state = args.state.next;

	if (!state.ownerType) {
		const listItems = MacroOwner.getLabels().map(owner => `<li>${localize(owner.typeKey)}</li>`);

		const content = sageCommand.createAdminRenderable("MACRO_TYPE_LIST");
		content.append(`<ul>${listItems.join("")}</ul>`);
		return content;
	}

	if (!state.ownerId) {
		const owners = await MacroOwner.getByType(sageCommand, state.ownerType);
		const ownerPages = partition(owners, (_, index) => Math.floor(index / DiscordMaxValues.component.select.optionCount));
		const pageIndex = Math.max(0, state.ownerPageIndex);
		const ownerPage = ownerPages[pageIndex] ?? ownerPages[0];

		const titleKey = MacroOwner.getLabel(state.ownerType).pluralKey;
		const content = sageCommand.createAdminRenderable(titleKey);

		if (ownerPage) {
			const listItems = ownerPage.map(owner => `<li>${owner.name}</li>`);
			content.append(`<ul>${listItems.join("")}</ul>`);
		}else {
			content.append(`<i>${localize("NONE_FOUND")}</i>`);
		}

		return content;
	}

	const { macros } = args;
	if (!macros) {
		return sageCommand.createAdminRenderable("FEATURE_NOT_IMPLEMENTED");
	}

	const macroPages = macros.getMacroPages(state) ?? [];
	const macroPageCount = macroPages.length;

	const pageMacros = macros.getMacros(state) ?? [];
	const first = pageMacros[0];

	// get selected category label
	const categoryLabel = !first || first.isUncategorized ? localize("UNCATEGORIZED") : first.category;
	const nameLabel = first?.name ?? localize("MACRO_NAME_EXAMPLE");

	const content = sageCommand.createAdminRenderable(macros.typeKey);
	if (pageMacros.length) {
		const pages = macroPageCount > 1 ? `(${localize("X_OF_Y", Math.max(1, state.macroPageIndex + 1), macroPageCount)})` : ``;
		content.appendTitledSection(
			`${categoryLabel} ${pages}`,
			toList(pageMacros)
		);
		content.appendTitledSection(
			`${localize("TO_VIEW_MACRO_USE_:")}`,
			`sage! macro details name="${nameLabel}"`
		);
	}else {
		content.appendTitledSection(
			categoryLabel,
			`${localize("NO_MACROS_FOUND")}`,
		);
		content.appendTitledSection(
			`${localize("TO_CREATE_MACRO_USE_:")}`,
			`sage! macro set name="${nameLabel}" dice="[1d20 atk; 1d6 dmg]"`
		);
	}
	return content;
}

export async function mCmdList(sageCommand: SageCommand, args?: Args | boolean): Promise<void> {
	const localize = sageCommand.getLocalizer();

	if (!sageCommand.allowCommand && !sageCommand.allowDice) {
		return sageCommand.replyStack.whisper(localize("CANNOT_MANAGE_MACRO_HERE"));
	}

	if (!args || args === true) {
		args = await getArgs(sageCommand);
	}

	const content = toUserMention(sageCommand.actorId);
	const embeds = await toRenderableContent(sageCommand, args);
	const components = await createListComponents(sageCommand, args);

	const message = sageCommand.isSageInteraction()
		? await sageCommand.fetchMessage()
		: undefined;
	if (message) {
		await message.edit(sageCommand.resolveToOptions({ content, embeds, components }));
	}else {
		await sageCommand.replyStack.send({ content, embeds, components });
	}
}

export async function handleSelection(sageInteraction: SageInteraction<StringSelectMenuInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();

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

	if (args.customIdArgs.action === "selectMacro") {
		return mCmdDetails(sageInteraction, args);
	}

	const content = await toRenderableContent(sageInteraction, args);
	const components = await createListComponents(sageInteraction, args);

	const message = await sageInteraction.fetchMessage();
	if (message) {
		await message.edit(sageInteraction.resolveToOptions({ embeds:content, components }));
	}
}
