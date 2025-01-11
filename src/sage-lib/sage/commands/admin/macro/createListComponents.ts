import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createMessageDeleteButton } from "../../../model/utils/deleteButton.js";
import type { Args } from "./getArgs.js";

// function createCustomId(sageCommand: SageCommand, action: MacroAction, name = ""): string {
// 	const userId = sageCommand.actorId;
// 	const ownerId = userId;
// 	const type = "user";
// 	return _createCustomId({ action, ownerId, name, type, userId });
// }

type Uncategorized = "Uncategorized";
const Uncategorized: Uncategorized = "Uncategorized";
function isUncategorized(value?: string): value is Uncategorized {
	return value === Uncategorized;
}

function createSelectCategoryPageSelect(sageCommand: SageCommand, { owner, selectedCategoryPageIndex }: Args): StringSelectMenuBuilder {
	const select = new StringSelectMenuBuilder().setCustomId(owner.createCustomId({ action:"selectCategoryPage", userId:sageCommand.actorId }));
	const pageCount = owner.categoryPageCount;
	for (let index = 0; index < pageCount; index++) {
		select.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`Categories: Page ${index + 1} of ${pageCount}`)
				.setValue(`${index}`)
				.setDefault(selectedCategoryPageIndex ? index === selectedCategoryPageIndex : index === 0)
		);
	}
	return select;
}

function createSelectCategorySelect(sageCommand: SageCommand, { owner, selectedCategoryPageIndex, selectedCategory }: Args): StringSelectMenuBuilder {
	const select = new StringSelectMenuBuilder().setCustomId(owner.createCustomId({ action:"selectCategory", userId:sageCommand.actorId }));
	const selectedPageCategories = owner.getCategories(selectedCategoryPageIndex ?? 0);
	selectedCategory = selectedCategory ?? selectedPageCategories[0];
	selectedPageCategories.forEach((category, index) => {
		select.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`Category: ${isUncategorized(category) ? sageCommand.getLocalizer()("UNCATEGORIZED") : category}`)
				.setValue(category)
				.setDefault(selectedCategory ? category === selectedCategory : index === 0)
		);
	});
	return select;
}

function createSelectMacroPageSelect(sageCommand: SageCommand, { owner, selectedCategory, selectedMacroPageIndex }: Args): StringSelectMenuBuilder {
	const select = new StringSelectMenuBuilder().setCustomId(owner.createCustomId({ action:"selectMacroPage", userId:sageCommand.actorId }));
	const pages = owner.macroPageCounts[selectedCategory ?? Uncategorized];
	for (let index = 0; index < pages; index++) {
		select.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`Macros: Page ${index + 1} of ${pages}`)
				.setValue(`${index}`)
				.setDefault(selectedMacroPageIndex ? index === selectedMacroPageIndex : index === 0)
		);
	}
	return select;
}

function createSelectMacroSelect(sageCommand: SageCommand, { owner, selectedCategory, selectedMacroPageIndex, selectedMacro }: Args): StringSelectMenuBuilder {
	const select = new StringSelectMenuBuilder().setCustomId(owner.createCustomId({ action:"selectMacro", userId:sageCommand.actorId }));
	select.setPlaceholder(`Select a Macro ...`);
	const selectedPageMacros = owner.getMacros({ category:selectedCategory ?? Uncategorized, pageIndex:selectedMacroPageIndex ?? 0 }).macros;
	selectedPageMacros.forEach(({ name }) => select.addOptions(
		new StringSelectMenuOptionBuilder()
			.setLabel(name)
			.setValue(name)
			.setDefault(name === selectedMacro)
		)
	);
	return select;
}

function createNewMacroButton(sageCommand: SageCommand, { owner, macro }: Args): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(owner.createCustomId({ action:"showNewMacro", userId:sageCommand.actorId, name:macro?.name }))
		.setStyle(ButtonStyle.Secondary)
		.setLabel(sageCommand.getLocalizer()("NEW"))
		;
}

function createDeleteCategoryButton(sageCommand: SageCommand, { owner }: Args): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(owner.createCustomId({ action:"deleteCategory", userId:sageCommand.actorId }))
		.setStyle(ButtonStyle.Danger)
		.setLabel(sageCommand.getLocalizer()("DELETE_CATEGORY"))
		.setDisabled(true)
		;
}

function createDeleteAllButton(sageCommand: SageCommand, { owner }: Args): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(owner.createCustomId({ action:"deleteAll", userId:sageCommand.actorId }))
		.setStyle(ButtonStyle.Danger)
		.setLabel(sageCommand.getLocalizer()("DELETE_ALL"))
		.setDisabled(true)
		;
}

export function createListComponents(sageCommand: SageCommand, args: Args): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] {
	const localize = sageCommand.getLocalizer();

	const components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];

	// get our starting values
	const { owner } = args;

	// add category pages dropdown if we have more than 1 page of categories
	if (owner.categoryPageCount > 1) {
		const selectCategoryPageSelect = createSelectCategoryPageSelect(sageCommand, args);
		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectCategoryPageSelect));
	}

	// add category dropdown for the currently selected category page
	const selectedPageCategories = owner.getCategories(args.selectedCategoryPageIndex ?? 0);
	const selectedCategory = args.selectedCategory ?? selectedPageCategories[0];
	const selectCategorySelect = createSelectCategorySelect(sageCommand, args);
	components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectCategorySelect));

	// we don't list macros unless we have selected a category
	if (selectedCategory) {
		// add macro pages dropdown if we have more than 1 page of categories
		if (owner.macroCounts[selectedCategory] && owner.macroPageCounts[selectedCategory] > 1) {
			const selectMacroPageSelect = createSelectMacroPageSelect(sageCommand, { ...args, selectedCategory });
			components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMacroPageSelect));
		}

		// add macro dropdown
		const selectMacroSelect = createSelectMacroSelect(sageCommand, { ...args, selectedCategory });
		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMacroSelect));
	}

	// add buttons
	const newButton = createNewMacroButton(sageCommand, args);
	const deleteButton = createDeleteCategoryButton(sageCommand, args);
	const deleteAllButton = createDeleteAllButton(sageCommand, args);
	const closeButton = createMessageDeleteButton(sageCommand, { label:localize("CLOSE"), style:ButtonStyle.Secondary });
	components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(newButton, deleteButton, deleteAllButton, closeButton));

	return components;
}