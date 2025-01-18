import { type Snowflake } from "@rsc-utils/core-utils";
import { getSelectedOrDefault, getSelectedOrDefaultNumber } from "../../../../../gameSystems/p20/lib/getSelectedOrDefault.js";
import { Macro } from "../../../model/Macro.js";
import type { MacroOwnerTypeKey } from "../../../model/MacroOwner.js";
import { Macros, type MacroIndex } from "../../../model/Macros.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { SageInteraction } from "../../../model/SageInteraction.js";
import { createCustomId as _createCustomId, parseCustomId, type CustomIdArgs, type MacroActionKey } from "./customId.js";

type ArgPair = { key:string; value:string; };
function pair(sageComand: SageCommand, ...keys: string[]): ArgPair | undefined {
	for (const key of keys) {
		const value = sageComand.args.getString(key);
		if (value) return { key, value };
	}
	return undefined;
}

type ArgPairs = { namePair?:ArgPair; categoryPair?:ArgPair; contentPair?:ArgPair; };
export function getArgPairs(sageComand: SageCommand): ArgPairs {
	const namePair = pair(sageComand, "name");
	const categoryPair = pair(sageComand, "cat", "category");
	const contentPair = pair(sageComand, "dice", "macro", "value", "table");
	return { namePair, categoryPair, contentPair };
}

export type MacroState<HasMacro extends boolean = false> = MacroIndex & {
	ownerType: HasMacro extends true ? MacroOwnerTypeKey : MacroOwnerTypeKey | undefined;
	ownerPageIndex: number;
	ownerId: HasMacro extends true ? Snowflake : Snowflake | undefined;
};

function updateMacroIndex(indexes: MacroIndex, args: Partial<MacroIndex>): MacroIndex {
	const ret = (changes: Partial<MacroIndex>) => ({ categoryPageIndex:-1, categoryIndex:-1, macroPageIndex:-1, macroIndex:-1, ...changes });

	const { categoryPageIndex = -1, categoryIndex = -1, macroPageIndex = -1, macroIndex = -1 } = args;

	if (categoryPageIndex !== indexes.categoryPageIndex) {
		return ret({ categoryPageIndex });
	}

	if (categoryIndex !== indexes.categoryIndex) {
		return ret({ categoryPageIndex, categoryIndex });
	}

	if (macroPageIndex !== indexes.macroPageIndex) {
		return ret({ categoryPageIndex, categoryIndex, macroPageIndex });
	}

	if (macroIndex !== indexes.macroIndex) {
		return ret({ categoryPageIndex, categoryIndex, macroPageIndex, macroIndex });
	}

	return { categoryPageIndex, categoryIndex, macroPageIndex, macroIndex };
}

function updateMacroState(state: MacroState, args: Partial<MacroState>): MacroState {
	const ret = (changes: Partial<MacroState>) => ({ ownerType:undefined, ownerPageIndex:-1, ownerId:undefined, categoryPageIndex:-1, categoryIndex:-1, macroPageIndex:-1, macroIndex:-1, ...changes });

	const { ownerType, ownerPageIndex = -1, ownerId } = args;

	if (ownerType !== state.ownerType) {
		return ret({ ownerType });
	}

	if (ownerPageIndex !== state.ownerPageIndex) {
		return ret({ ownerType, ownerPageIndex });
	}

	if (ownerId !== state.ownerId) {
		return ret({ ownerType, ownerPageIndex, ownerId });
	}

	return ret({ ownerType, ownerPageIndex, ownerId, ...updateMacroIndex(state, args) });
}

export type Args<HasMacros extends boolean = false, HasMacro extends boolean = false> = {
	customIdArgs: HasMacro extends true ? CustomIdArgs : CustomIdArgs | undefined;
	macro: HasMacro extends true ? Macro : Macro | undefined;
	macros: HasMacros extends true ? Macros : Macros | undefined;
	state: {
		prev: MacroState<HasMacro>;
		next: MacroState;
	};
};

export async function getArgs<HasMacros extends boolean = false, HasMacro extends boolean = false>(sageInteraction: SageInteraction): Promise<Args<HasMacros, HasMacro> & { customIdArgs:CustomIdArgs; }>;
export async function getArgs<HasMacros extends boolean = false, HasMacro extends boolean = false>(sageCommand: SageCommand): Promise<Args<HasMacros, HasMacro> & { customIdArgs?:CustomIdArgs; }>;
export async function getArgs(sageCommand: SageCommand): Promise<Args> {
	const { actorId } = sageCommand;
	const customIdArgs = sageCommand.parseCustomId(parseCustomId);
	const { messageId, state = { ownerType:undefined, ownerPageIndex:-1, ownerId:undefined, categoryPageIndex:-1, categoryIndex:-1, macroPageIndex:-1, macroIndex:-1 } } = customIdArgs ?? {};
	const owner = state.ownerType && state.ownerId ? { type:state.ownerType, id:state.ownerId } : undefined;
	let macros = owner ? await Macros.parse(sageCommand, owner) : undefined;
	let macro: Macro | undefined;

	const createCustomId = (action: MacroActionKey) => _createCustomId({ action, actorId, messageId, state });
	const ret = (args: Partial<MacroState>) => {
		const updatedArgs = { customIdArgs, macro, macros, state:{ prev:state, next:updateMacroState(state, args) } };
		return updatedArgs;
	};

	let { ownerType } = state;
	const selectOwnerTypeId = createCustomId("selectOwnerType");
	if (sageCommand.customIdMatches(selectOwnerTypeId)) {
		ownerType = getSelectedOrDefault(sageCommand, selectOwnerTypeId) as MacroOwnerTypeKey;
		macros = undefined;
		return ret({ ownerType });
	}

	let { ownerPageIndex } = state;
	const selectOwnerPageIndexId = createCustomId("selectOwnerPage");
	if (sageCommand.customIdMatches(selectOwnerPageIndexId)) {
		ownerPageIndex = getSelectedOrDefaultNumber(sageCommand, selectOwnerPageIndexId) ?? -1;
		macros = undefined;
		return ret({ ownerType, ownerPageIndex });
	}

	let { ownerId } = state;
	const selectOwnerId = createCustomId("selectOwnerId");
	if (sageCommand.customIdMatches(selectOwnerId)) {
		ownerId = getSelectedOrDefault(sageCommand, selectOwnerId) as Snowflake;
		macros = await Macros.parse(sageCommand, { id:ownerId, type:ownerType! });
		return ret({ ownerType, ownerPageIndex, ownerId });
	}

	let { categoryPageIndex } = state;
	const categoryPageIndexId = createCustomId("selectCategoryPage");
	if (sageCommand.customIdMatches(selectOwnerId)) {
		categoryPageIndex = getSelectedOrDefaultNumber(sageCommand, categoryPageIndexId) ?? -1;
		return ret({ ownerType, ownerPageIndex, ownerId, categoryPageIndex });
	}

	let { categoryIndex } = state;
	const categoryIndexId = createCustomId("selectCategory");
	if (sageCommand.customIdMatches(categoryIndexId)) {
		categoryIndex = getSelectedOrDefaultNumber(sageCommand, categoryIndexId) ?? -1;
		return ret({ ownerType, ownerPageIndex, ownerId, categoryPageIndex, categoryIndex });
	}

	const categoryPair = pair(sageCommand, "cat", "category");
	if (categoryPair?.value) {
		const categoryMeta = macros?.findCategoryMeta(categoryPair.value);
		if (categoryMeta) {
			categoryPageIndex = categoryMeta.categoryPageIndex;
			categoryIndex = categoryMeta.categoryIndex;
			return ret({ ownerType, ownerPageIndex, ownerId, categoryPageIndex, categoryIndex });
		}
	}

	let { macroPageIndex } = state;
	const macroPageIndexId = createCustomId("selectMacroPage");
	if (sageCommand.customIdMatches(macroPageIndexId)) {
		macroPageIndex = getSelectedOrDefaultNumber(sageCommand, macroPageIndexId) ?? -1;
		return ret({ ownerType, ownerPageIndex, ownerId, categoryPageIndex, categoryIndex, macroPageIndex });
	}

	let { macroIndex } = state;
	const macroIndexId = createCustomId("selectMacro");
	if (sageCommand.customIdMatches(macroIndexId)) {
		macroIndex = getSelectedOrDefaultNumber(sageCommand, macroIndexId) ?? -1;
	}

	const macroPair = pair(sageCommand, "name");
	if (macroPair?.value) {
		const macroMeta = macros?.findMacroMeta(macroPair.value);
		if (macroMeta) {
			categoryPageIndex = macroMeta.categoryPageIndex;
			categoryIndex = macroMeta.categoryIndex;
			macroPageIndex = macroMeta.macroPageIndex;
			macroIndex = macroMeta.macroIndex;
		}
	}

	macro = macros?.getMacro({ categoryPageIndex, categoryIndex, macroPageIndex, macroIndex });

	return ret({ ownerType, ownerPageIndex, ownerId, categoryPageIndex, categoryIndex, macroPageIndex, macroIndex });
}