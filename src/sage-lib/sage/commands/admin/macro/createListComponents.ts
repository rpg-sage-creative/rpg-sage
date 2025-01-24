import { partition } from "@rsc-utils/array-utils";
import type { Snowflake } from "@rsc-utils/core-utils";
import { DiscordMaxValues } from "@rsc-utils/discord-utils";
import { ELLIPSIS } from "@rsc-utils/string-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import type { Localizer } from "../../../../../sage-lang/getLocalizedText.js";
import { MacroOwner } from "../../../model/MacroOwner.js";
import type { Macros } from "../../../model/Macros.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createMessageDeleteButton } from "../../../model/utils/deleteButton.js";
import { createCustomId, type MacroActionKey } from "./customId.js";
import type { Args, MacroState } from "./getArgs.js";
import { MacroMode, type Mode } from "./MacroMode.js";


export type CreateArgs = {
	actorId: Snowflake;
	localize: Localizer;
	messageId?: Snowflake;
	mode: Mode;
	state: MacroState;
};

type HasOwnerPagesCreateArgs = CreateArgs & { ownerPages: MacroOwner[][]; };
type HasOwnersCreateArgs = CreateArgs & { owners: MacroOwner[]; };
type HasMacrosCreateArgs = CreateArgs & { macros: Macros; };

function createSelect(action: MacroActionKey, { actorId, messageId, state }: CreateArgs, placeholder?: string): StringSelectMenuBuilder {
	const select = new StringSelectMenuBuilder()
		.setCustomId(createCustomId({ actorId, action, messageId, state }));
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

function createSelectOwnerTypeSelect(args: CreateArgs): StringSelectMenuBuilder {
	const { ownerType } = args.state;

	const select = createSelect("selectOwnerType", args, args.localize("SELECT_MACRO_TYPE"));

	MacroOwner.getLabels().forEach(({ type, typeKey }) =>
		select.addOptions(createOption(args.localize(typeKey), type, ownerType === type))
	);

	disableIfEmpty(select);
	return select;
}

function createSelectOwnerPageSelect(args: HasOwnerPagesCreateArgs): StringSelectMenuBuilder {
	const { localize } = args;
	const { ownerPageIndex, ownerType } = args.state;

	const localizedPlural = localize(ownerType ? MacroOwner.getLabel(ownerType).pluralKey : "OWNERS");
	const pageCount = args.ownerPages.length;

	const select = createSelect("selectOwnerPage", args);

	for (let index = 0; index < pageCount; index++) {
		select.addOptions(createOption(`${localizedPlural}: ${localize("PAGE_X_OF_Y", index + 1, pageCount)}`, index, ownerPageIndex > -1 ? index === ownerPageIndex : index === 0));
	}

	disableIfEmpty(select);
	if (ownerType !== "user") select.setDisabled(true);
	return select;
}

function createSelectOwnerIdSelect(args: HasOwnersCreateArgs): StringSelectMenuBuilder {
	const { ownerId } = args.state;

	const select = createSelect("selectOwnerId", args);

	args.owners.forEach(({ id, name }) =>
		select.addOptions(createOption(name, id, ownerId === id))
	);

	disableIfEmpty(select);
	return select;
}

function createSelectCategoryPageSelect(args: HasMacrosCreateArgs): StringSelectMenuBuilder {
	const { localize } = args;

	const localizedCategories = localize("CATEGORIES");
	const pageCount = args.macros.getCategoryPages().length;
	const { categoryPageIndex } = args.state;

	const select = createSelect("selectCategoryPage", args);

	for (let index = 0; index < pageCount; index++) {
		select.addOptions(createOption(`${localizedCategories}: ${localize("PAGE_X_OF_Y", index + 1, pageCount)}`, index, categoryPageIndex > -1 ? index === categoryPageIndex : index === 0));
	}

	disableIfEmpty(select);
	return select;
}

function createSelectCategorySelect(args: HasMacrosCreateArgs): StringSelectMenuBuilder {
	const { localize, macros, state } = args;

	const localizedCategory = localize("CATEGORY");
	const localizedUncategorized = localize("UNCATEGORIZED");

	const indexes = { categoryPageIndex:Math.max(state.categoryPageIndex, 0) };
	const selectedPageCategories = macros?.getCategories(indexes);

	const { categoryIndex } = state;

	const select = createSelect("selectCategory", args);

	selectedPageCategories.forEach((category, index) =>
		select.addOptions(createOption(`${localizedCategory}: ${category === "Uncategorized" ? localizedUncategorized : category}`, index, categoryIndex > -1 ? index === categoryIndex : index === 0))
	);

	disableIfEmpty(select);
	return select;
}

function createSelectMacroPageSelect(args: HasMacrosCreateArgs): StringSelectMenuBuilder {
	const { localize, macros, state } = args;

	const localizedMacros = localize("MACROS");
	const macroPages = macros.getMacroPages(state);
	const pageCount = macroPages.length ?? 0;
	const { macroPageIndex } = state;

	const select = createSelect("selectMacroPage", args);

	for (let index = 0; index < pageCount; index++) {
		select.addOptions(createOption(`${localizedMacros}: ${localize("PAGE_X_OF_Y", index + 1, pageCount)}`, index, macroPageIndex > -1 ? index === macroPageIndex : index === 0));
	}

	disableIfEmpty(select);
	return select;
}

function createSelectMacroSelect(args: HasMacrosCreateArgs): StringSelectMenuBuilder {
	const { localize, macros, state } = args;

	const pageMacros = macros.getMacros(state);
	const { macroIndex } = state;

	const select = createSelect("selectMacro", args, localize("SELECT_A_MACRO"));

	pageMacros.forEach(({ name }, index) =>
		select.addOptions(createOption(name, index, macroIndex === index))
	);

	disableIfEmpty(select);
	return select;
}

function createNewMacroButton({ actorId, localize, messageId, state }: CreateArgs): ButtonBuilder {
	const customId = createCustomId({ actorId, action:"showNewMacroModal", messageId, state });
	return new ButtonBuilder()
		.setCustomId(customId)
		.setStyle(ButtonStyle.Secondary)
		.setLabel(localize("NEW"))
		;
}

export function createResetControlButton({ actorId, localize, messageId, state }: CreateArgs): ButtonBuilder {
	const customId = createCustomId({ actorId, action:"resetControl", messageId, state });
	return new ButtonBuilder()
		.setCustomId(customId)
		.setStyle(ButtonStyle.Secondary)
		.setLabel(localize("RESET"))
		;
}

export function createToggleModeButton({ actorId, messageId, mode, state }: CreateArgs): ButtonBuilder {
	const { action } = MacroMode.next(mode);
	return new ButtonBuilder()
		.setCustomId(createCustomId({ action, actorId, messageId, state }))
		.setStyle(ButtonStyle.Secondary)
		// .setEmoji(MacroMode.next(mode).emoji)
		.setLabel(ELLIPSIS)
		;
}

export function createCloseButton(sageCommand: SageCommand): ButtonBuilder {
	return createMessageDeleteButton(sageCommand, { label:sageCommand.getLocalizer()("CLOSE"), style:ButtonStyle.Secondary });
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

function createDeleteAllButton({ actorId, localize, messageId, state }: CreateArgs): ButtonBuilder {
	const customId = createCustomId({ action:"promptDeleteAll", actorId, messageId, state });
	return new ButtonBuilder()
		.setCustomId(customId)
		.setStyle(ButtonStyle.Danger)
		.setLabel(localize("DELETE_ALL"))
		;
}

export async function createListComponents(sageCommand: SageCommand, args: Args): Promise<ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[]> {
	const componentsAndMode = await createListComponentsAndMode(sageCommand, args);
	return componentsAndMode.components;
}
type ComponentsAndMode = {
	components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];
	mode: Mode;
}
export async function createListComponentsAndMode(sageCommand: SageCommand, args: Args, noButtons?: boolean): Promise<ComponentsAndMode> {
	const localize = sageCommand.getLocalizer();

	const components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];

	const macroMode = await MacroMode.from(sageCommand);
	const { mode } = macroMode;

	const { actorId } = sageCommand;
	const { macros } = args;
	const { messageId } = args.customIdArgs ?? {};
	const state = args.state?.next;

	// if we don't have macros then that means we haven't selected a macro owner ... show those separately from the macro selection sequence
	if (!macros) {
		const baseArgs = { actorId, localize, macros, mode, state }

		const selectOwnerTypeSelect = createSelectOwnerTypeSelect(baseArgs);
		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectOwnerTypeSelect));

		if (state.ownerType) {
			const owners = await MacroOwner.getByType(sageCommand, state.ownerType);
			const ownerPages = partition(owners, (_, index) => Math.floor(index / DiscordMaxValues.component.select.optionCount));

			if (ownerPages.length > 1) {
				const selectOwnerPageSelect = createSelectOwnerPageSelect({ ...baseArgs, ownerPages });
				components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectOwnerPageSelect));
			}

			const selectOwnerIdSelect = createSelectOwnerIdSelect({ ...baseArgs, owners });
			components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectOwnerIdSelect));
		}

		components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(createCloseButton(sageCommand)));

		return { components, mode };
	}

	const baseArgs = { actorId, localize, macros, messageId, mode, state }

	// add category pages dropdown if we have more than 1 page of categories
	if (macros.shouldShowCategoryPages()) {
		const selectCategoryPageSelect = createSelectCategoryPageSelect(baseArgs);
		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectCategoryPageSelect));
	}

	// add category dropdown for the currently selected category page
	if (macros.shouldShowCategories()) {
		const selectCategorySelect = createSelectCategorySelect(baseArgs);
		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectCategorySelect));
	}

	// add macro pages dropdown if we have more than 1 page of categories
	if (macros.shouldShowMacroPages(state)) {
		const selectMacroPageSelect = createSelectMacroPageSelect(baseArgs);
		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMacroPageSelect));
	}

	// add macro dropdown
	if (macros.shouldShowMacros(state)) {
		const selectMacroSelect = createSelectMacroSelect(baseArgs);
		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMacroSelect));
	}

	// if we are creating buttons for details, let's not bother making the list buttons
	if (noButtons) {
		return { components, mode };
	}

	// add buttons

	const buttonRow = new ActionRowBuilder<ButtonBuilder>();

	const canInfo = args.customIdArgs?.actorId === sageCommand.actorId;
	const canEdit = args.macros?.canActorEdit(sageCommand);

	if (mode === "edit" && canEdit) {
		buttonRow.addComponents(
			createNewMacroButton(baseArgs)
		);
		// if (state.categoryPageIndex > -1) {
		// 	buttonRow.addComponents(
		// 		createDeleteCategoryButton({ actorId, localize, state })
		// 	);
		// }
		if (!macros.isEmpty) {
			buttonRow.addComponents(
				createDeleteAllButton(baseArgs).setDisabled(macros.isEmpty)
			);
		}
		buttonRow.addComponents(
			createToggleModeButton(baseArgs),
		);

	}else if (mode === "other" && canInfo) {
		buttonRow.addComponents(
			createResetControlButton(baseArgs),
			createToggleModeButton(baseArgs),
		);

	}else {
		buttonRow.addComponents(
			createCloseButton(sageCommand),
		);
		if (canEdit) {
			buttonRow.addComponents(
				createToggleModeButton(baseArgs),
			);
		}

	}

	components.push(buttonRow);

	return { components, mode };
}