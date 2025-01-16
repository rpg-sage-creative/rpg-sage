import { partition } from "@rsc-utils/array-utils";
import { DiscordMaxValues } from "@rsc-utils/discord-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { StringSelectMenuInteraction } from "discord.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { SageInteraction } from "../../../model/SageInteraction.js";
import { createListComponents } from "./createListComponents.js";
import { getArgs, type Args } from "./getArgs.js";
import type { Macro } from "./Macro.js";
import { getOwners, getOwnerType, getOwnerTypes } from "./Owner.js";

function toList(macros: Macro[]): string {
	const listItems = macros.map(macro => {
		if (macro.type !== "dice") {
			return `<li>${macro.name} <i>(${macro.type})</i></li>`;
		}
		return `<li>${macro.name}</li>`;
	});
	return `<ul>${listItems.join("")}</ul>`;
}

function toRenderableContent(sageCommand: SageCommand, args: Args): RenderableContent {
	const localize = sageCommand.getLocalizer();

	const state = args.state.next;

	if (!state.ownerType) {
		const listItems = getOwnerTypes().map(owner => `<li>${localize(owner.pluralKey)}</li>`);

		const content = sageCommand.createAdminRenderable("MACRO_TYPE_LIST");
		content.append(`<ul>${listItems.join("")}</ul>`);
		return content;
	}

	if (!state.ownerId) {
		const owners = getOwners(sageCommand, state.ownerType);
		const ownerPages = partition(owners, (_, index) => Math.floor(index / DiscordMaxValues.component.select.optionCount));
		const pageIndex = Math.max(0, state.ownerPageIndex);
		const ownerPage = ownerPages[pageIndex] ?? ownerPages[0];

		const titleKey = getOwnerType(state.ownerType)?.pluralKey;
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

	const content = sageCommand.createAdminRenderable(getOwnerType(macros.type)?.typeKey);
	if (pageMacros.length) {
		const pages = macroPageCount > 1 ? `(${localize("X_OF_Y", state.macroPageIndex + 1, macroPageCount)})` : ``;
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

export async function mCmdList(sageCommand: SageCommand): Promise<void> {
	const localize = sageCommand.getLocalizer();

	if (!sageCommand.allowCommand && !sageCommand.allowDice) {
		return sageCommand.replyStack.whisper(localize("CANNOT_MANAGE_MACRO_HERE"));
	}

	const args = await getArgs(sageCommand);
	const content = toRenderableContent(sageCommand, args);
	const components = createListComponents(sageCommand, args);

	const message = sageCommand.isSageInteraction()
		? await sageCommand.fetchMessage()
		: undefined;
	if (message) {
		await message.edit(sageCommand.resolveToOptions({ embeds:content, components }));
	}else {
		await sageCommand.replyStack.send({ embeds:content, components });
	}
}

export async function handleSelection(sageInteraction: SageInteraction<StringSelectMenuInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();

	const args = await getArgs(sageInteraction);
	const content = toRenderableContent(sageInteraction, args);
	const components = createListComponents(sageInteraction, args);

	const message = await sageInteraction.fetchMessage();
	if (message) {
		await message.edit(sageInteraction.resolveToOptions({ embeds:content, components }));
	}
}
