import { partition } from "@rsc-utils/array-utils";
import type { Snowflake } from "@rsc-utils/core-utils";
import { DiscordMaxValues } from "@rsc-utils/discord-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import type { Localizer } from "../../../../../sage-lang/getLocalizedText.js";
import { MacroOwner } from "../../../model/MacroOwner.js";
import type { Macros } from "../../../model/Macros.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createMessageDeleteButton } from "../../../model/utils/deleteButton.js";
import { createCustomId, type MacroActionKey } from "./customId.js";
import type { Args, MacroState } from "./getArgs.js";

type CreateArgs = { actorId: Snowflake; localize: Localizer; state: MacroState; };
type HasOwnerPagesCreateArgs = CreateArgs & { ownerPages: MacroOwner[][]; };
type HasOwnersCreateArgs = CreateArgs & { owners: MacroOwner[]; };
type HasMacrosCreateArgs = CreateArgs & { macros: Macros; };

function createSelect(action: MacroActionKey, actorId: Snowflake, state: MacroState, placeholder?: string): StringSelectMenuBuilder {
	const select = new StringSelectMenuBuilder()
		.setCustomId(createCustomId({ actorId, action, state }));
	if (placeholder) {
		select.setPlaceholder(placeholder);
	}
	return select;
}

function disableIfEmpty(select: StringSelectMenuBuilder): void {
	if (!select.options.length) {
		select.addOptions(createOption("None", "None", false));
		select.setDisabled(true);
	}
}

function createOption(label: string, value: string | number, isDefault: boolean): StringSelectMenuOptionBuilder {
	return new StringSelectMenuOptionBuilder().setLabel(label).setValue(`${value}`).setDefault(isDefault);
}

function createSelectOwnerTypeSelect({ actorId, localize, state }: CreateArgs): StringSelectMenuBuilder {
	const select = createSelect("selectOwnerType", actorId, state, localize("SELECT_MACRO_TYPE"));

	const selectedOwnerType = state.ownerType;

	MacroOwner.getLabels().forEach(({ type, typeKey }) =>
		select.addOptions(createOption(localize(typeKey), type, selectedOwnerType === type))
	);

	disableIfEmpty(select);
	return select;
}

function createSelectOwnerPageSelect({ actorId, localize, ownerPages, state }: HasOwnerPagesCreateArgs): StringSelectMenuBuilder {
	const select = createSelect("selectOwnerPage", actorId, state);

	const localizedPlural = localize(state.ownerType ? MacroOwner.getLabel(state.ownerType).pluralKey : "OWNERS");
	const pageCount = ownerPages.length;
	const selectedIndex = state.ownerPageIndex;

	for (let index = 0; index < pageCount; index++) {
		select.addOptions(createOption(`${localizedPlural}: ${localize("PAGE_X_OF_Y", index + 1, pageCount)}`, index, selectedIndex > -1 ? index === selectedIndex : index === 0));
	}

	disableIfEmpty(select);
	if (state.ownerType !== "user") select.setDisabled(true);
	return select;
}

function createSelectOwnerIdSelect({ actorId, owners, state }: HasOwnersCreateArgs): StringSelectMenuBuilder {
	const select = createSelect("selectOwnerId", actorId, state);
	const selectedOwnerId = state.ownerId;

	owners.forEach(({ id, name }) =>
		select.addOptions(createOption(name, id, selectedOwnerId === id))
	);

	disableIfEmpty(select);
	return select;
}

function createSelectCategoryPageSelect({ actorId, localize, macros, state }: HasMacrosCreateArgs): StringSelectMenuBuilder {
	const select = createSelect("selectCategoryPage", actorId, state);

	const localizedCategories = localize("CATEGORIES");
	const pageCount = macros.getCategoryPages().length;
	const selectedIndex = state.categoryPageIndex;

	for (let index = 0; index < pageCount; index++) {
		select.addOptions(createOption(`${localizedCategories}: ${localize("PAGE_X_OF_Y", index + 1, pageCount)}`, index, selectedIndex > -1 ? index === selectedIndex : index === 0));
	}

	disableIfEmpty(select);
	return select;
}

function createSelectCategorySelect({ actorId, localize, macros, state }: HasMacrosCreateArgs): StringSelectMenuBuilder {
	const select = createSelect("selectCategory", actorId, state);

	const localizedCategory = localize("CATEGORY");
	const localizedUncategorized = localize("UNCATEGORIZED");
	const indexes = { categoryPageIndex:Math.max(state.categoryPageIndex, 0) };
	const selectedPageCategories = macros?.getCategories(indexes);
	const selectedIndex = state.categoryIndex;

	selectedPageCategories.forEach((category, index) =>
		select.addOptions(createOption(`${localizedCategory}: ${category === "Uncategorized" ? localizedUncategorized : category}`, index, selectedIndex > -1 ? index === selectedIndex : index === 0))
	);

	disableIfEmpty(select);
	return select;
}

function createSelectMacroPageSelect({ actorId, localize, macros, state }: HasMacrosCreateArgs): StringSelectMenuBuilder {
	const select = createSelect("selectMacroPage", actorId, state);

	const localizedMacros = localize("MACROS");
	const macroPages = macros.getMacroPages(state);
	const pageCount = macroPages.length ?? 0;
	const selectedIndex = state.macroPageIndex;

	for (let index = 0; index < pageCount; index++) {
		select.addOptions(createOption(`${localizedMacros}: ${localize("PAGE_X_OF_Y", index + 1, pageCount)}`, index, selectedIndex > -1 ? index === selectedIndex : index === 0));
	}

	disableIfEmpty(select);
	return select;
}

function createSelectMacroSelect({ actorId, localize, macros, state }: HasMacrosCreateArgs): StringSelectMenuBuilder {
	const select = createSelect("selectMacro", actorId, state, localize("SELECT_A_MACRO"));

	const pageMacros = macros.getMacros(state);
	const selectedIndex = state.macroIndex;

	pageMacros.forEach(({ name }, index) =>
		select.addOptions(createOption(name, index, selectedIndex === index))
	);

	disableIfEmpty(select);
	return select;
}

function createNewMacroButton({ actorId, localize, state }: CreateArgs): ButtonBuilder {
	const customId = createCustomId({ actorId, action:"showNewMacroModal", state });
	return new ButtonBuilder()
		.setCustomId(customId)
		.setStyle(ButtonStyle.Secondary)
		.setLabel(localize("NEW"))
		;
}

// function createDeleteCategoryButton({ actorId, localize, state }: CreateArgs): ButtonBuilder {
// 	const customId = createCustomId({ actorId, action:"deleteCategory", state });
// 	return new ButtonBuilder()
// 		.setCustomId(customId)
// 		.setStyle(ButtonStyle.Danger)
// 		.setLabel(localize("DELETE_CATEGORY"))
// 		.setDisabled(true)
// 		;
// }

// function createDeleteAllButton({ actorId, localize, state }: CreateArgs): ButtonBuilder {
// 	const customId = createCustomId({ actorId, action:"deleteAll", state });
// 	return new ButtonBuilder()
// 		.setCustomId(customId)
// 		.setStyle(ButtonStyle.Danger)
// 		.setLabel(localize("DELETE_ALL"))
// 		.setDisabled(true)
// 		;
// }

export async function createListComponents(sageCommand: SageCommand, args: Args): Promise<ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[]> {
	const localize = sageCommand.getLocalizer();

	const components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];

	const { actorId } = sageCommand;
	const { macros } = args;
	const state = args.state?.next;

	// if we don't have macros then that means we haven't selected a macro owner ... show those separately from the macro selection sequence
	if (!macros) {
		const selectOwnerTypeSelect = createSelectOwnerTypeSelect({ actorId, localize, state });
		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectOwnerTypeSelect));

		if (state.ownerType) {
			const owners = await MacroOwner.getByType(sageCommand, state.ownerType);
			const ownerPages = partition(owners, (_, index) => Math.floor(index / DiscordMaxValues.component.select.optionCount));

			if (ownerPages.length > 1) {
				const selectOwnerPageSelect = createSelectOwnerPageSelect({ actorId, localize, ownerPages, state });
				components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectOwnerPageSelect));
			}

			const selectOwnerIdSelect = createSelectOwnerIdSelect({ actorId, localize, owners, state });
			components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectOwnerIdSelect));
		}

		const closeButton = createMessageDeleteButton(sageCommand, { label:localize("CLOSE"), style:ButtonStyle.Secondary });
		components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton));

		return components;
	}

	// add category pages dropdown if we have more than 1 page of categories
	if (macros.shouldShowCategoryPages()) {
		const selectCategoryPageSelect = createSelectCategoryPageSelect({ actorId, localize, macros, state });
		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectCategoryPageSelect));
	}

	// add category dropdown for the currently selected category page
	if (macros.shouldShowCategories()) {
		const selectCategorySelect = createSelectCategorySelect({ actorId, localize, macros, state });
		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectCategorySelect));
	}

	// add macro pages dropdown if we have more than 1 page of categories
	if (macros.shouldShowMacroPages(state)) {
		const selectMacroPageSelect = createSelectMacroPageSelect({ actorId, localize, macros, state });
		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMacroPageSelect));
	}

	// add macro dropdown
	if (macros.shouldShowMacros(state)) {
		const selectMacroSelect = createSelectMacroSelect({ actorId, localize, macros, state });
		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMacroSelect));
	}

	const buttonRow = new ActionRowBuilder<ButtonBuilder>();

	// add buttons
	const newButton = createNewMacroButton({ actorId, localize, state });
	// const deleteButton = createDeleteCategoryButton({ actorId, localize, state });
	// const deleteAllButton = createDeleteAllButton({ actorId, localize, state });
	const closeButton = createMessageDeleteButton(sageCommand, { label:localize("CLOSE"), style:ButtonStyle.Secondary });

	buttonRow.addComponents(newButton, closeButton)

	components.push(buttonRow);

	return components;
}