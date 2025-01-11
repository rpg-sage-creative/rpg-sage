import type { RenderableContent } from "@rsc-utils/render-utils";
import type { StringSelectMenuInteraction } from "discord.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { SageInteraction } from "../../../model/SageInteraction.js";
import { createListComponents } from "./createListComponents.js";
import { Uncategorized } from "./customId.js";
import { getArgs, type Args } from "./getArgs.js";
import type { Macro } from "./HasMacros.js";

function toList(macros: Macro[]): string {
	const listItems = macros.map(macro => {
		if (macro.type !== "dice") {
			return `<li>${macro.name} <i>(${macro.type})</i></li>`;
		}
		return `<li>${macro.name}</li>`;
	});
	return `<ul>${listItems.join("")}</ul>`;
}

function toRenderableContent(sageCommand: SageCommand, { owner, selectedCategory, selectedMacroPageIndex }: Args): RenderableContent {
	const localize = sageCommand.getLocalizer();

	// filter the macros
	const { macros, pageCount, pageIndex } = owner.getMacros({ category:selectedCategory ?? Uncategorized, pageIndex:selectedMacroPageIndex ?? 0 });

	const first = macros[0];

	// get selected category label
	const category = first?.category ?? localize("UNCATEGORIZED");

	const content = sageCommand.createAdminRenderable("MACRO_LIST");
	if (macros.length) {
		const pages = pageCount > 1 ? `(${pageIndex + 1} of ${pageCount})` : ``;
		content.appendTitledSection(
			`${category} ${pages}`,
			toList(macros)
		);
		content.appendTitledSection(
			`${localize("TO_VIEW_MACRO_USE_:")}`,
			`sage! macro details name="${first?.name ?? localize("MACRO_NAME_EXAMPLE")}"`
		);
	}else {
		content.appendTitledSection(
			category,
			`${localize("NO_MACROS_FOUND")}`,
		);
		content.appendTitledSection(
			`${localize("TO_CREATE_MACRO_USE_:")}`,
			`sage! macro set name="${first?.name ?? localize("MACRO_NAME_EXAMPLE")}" dice="[1d20 atk; 1d6 dmg]"`
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

export async function mSelectCategory(sageInteraction: SageInteraction<StringSelectMenuInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();

	const args = await getArgs(sageInteraction);
	const content = toRenderableContent(sageInteraction, args);
	const components = createListComponents(sageInteraction, args);

	const message = await sageInteraction.fetchMessage();
	if (message) {
		await message.edit(sageInteraction.resolveToOptions({ embeds:content, components }));
	}
}

export async function mSelectMacroPage(sageInteraction: SageInteraction<StringSelectMenuInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();

	const args = await getArgs(sageInteraction);
	const content = toRenderableContent(sageInteraction, args);
	const components = createListComponents(sageInteraction, args);

	const message = await sageInteraction.fetchMessage();
	if (message) {
		await message.edit(sageInteraction.resolveToOptions({ embeds:content, components }));
	}
}
