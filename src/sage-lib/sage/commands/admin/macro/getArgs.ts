import { getSelectedOrDefault, getSelectedOrDefaultNumber } from "../../../../../gameSystems/p20/lib/getSelectedOrDefault.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { SageInteraction } from "../../../model/SageInteraction.js";
import { parseCustomId, type CustomIdArgs, type MacroAction } from "./customId.js";
import { HasMacros, type Macro } from "./HasMacros.js";

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

export type Args<HasMacro extends boolean = false> = {
	customIdArgs: HasMacro extends true ? CustomIdArgs : CustomIdArgs | undefined;
	macro: HasMacro extends true ? Macro : Macro | undefined;
	owner: HasMacros;
	selectedCategoryPageIndex: HasMacro extends true ? number : number | undefined;
	selectedCategory: HasMacro extends true ? string : string | undefined;
	selectedMacroPageIndex: HasMacro extends true ? number : number | undefined;
	selectedMacro: HasMacro extends true ? string : string | undefined;
};

function getCategoryMeta(owner: HasMacros, selectedCategory?: string) {
	if (selectedCategory) {
		const categoryMeta = owner.getCategoryMeta({ selectedCategory });
		if (categoryMeta) {
			return {
				selectedCategory: categoryMeta.category,
				selectedCategoryPageIndex: categoryMeta.categoryPageIndex,
				// selectedMacroPageIndex
			};
		}
	}
	return undefined;
}

function getMacroMeta(owner: HasMacros, selectedMacro?: string) {
	if (selectedMacro) {
		const macroMeta = owner.getMacroMeta({ name:selectedMacro });
		if (macroMeta) {
			return {
				macro: macroMeta.macro,
				selectedCategoryPageIndex: macroMeta.categoryPageIndex,
				selectedCategory: macroMeta.category,
				selectedMacroPageIndex: macroMeta.macroPageIndex,
				selectedMacro: macroMeta.macro.name
			};
		}
	}
	return undefined;
}

export async function getOwner(sageCommand: SageCommand): Promise<HasMacros> {
	const owner = await HasMacros.parse(sageCommand, { ownerType:"user" });
	return owner;
}

export async function getArgs<HasMacro extends boolean = false>(sageInteraction: SageInteraction): Promise<Args<HasMacro> & { customIdArgs:CustomIdArgs; }>;
export async function getArgs<HasMacro extends boolean = false>(sageCommand: SageCommand): Promise<Args<HasMacro> & { customIdArgs?:CustomIdArgs; }>;
export async function getArgs(sageCommand: SageCommand): Promise<Args> {
	const owner = await getOwner(sageCommand);

	const customIdArgs = sageCommand.isSageInteraction() ? sageCommand.parseCustomId(parseCustomId) : undefined;

	const createCustomId = (action: MacroAction) => owner.createCustomId({ userId:sageCommand.actorId, action });
	const customIdMatches = (customId: string) => sageCommand.isSageInteraction() ? sageCommand.customIdMatches(customId) : false;

	const selectCategoryPageCustomId = createCustomId("selectCategoryPage");
	const selectedCategoryPageIndex = getSelectedOrDefaultNumber(sageCommand, selectCategoryPageCustomId);

	const selectCategoryCustomId = createCustomId("selectCategory");
	const selectedCategory = getSelectedOrDefault(sageCommand, selectCategoryCustomId, "cat", "category") ?? (selectedCategoryPageIndex ? owner.getCategories(selectedCategoryPageIndex)[0] : undefined);

	if (customIdMatches(selectCategoryPageCustomId) || customIdMatches(selectCategoryCustomId)) {
		const categoryMeta = getCategoryMeta(owner, selectedCategory)
		return { customIdArgs, owner, ...(categoryMeta ?? { owner, selectedCategoryPageIndex, selectedCategory }) } as Args<false>;
	}

	const selectMacroPageCustomId = createCustomId("selectMacroPage");
	const selectedMacroPageIndex = getSelectedOrDefaultNumber(sageCommand, selectMacroPageCustomId);
	if (customIdMatches(selectMacroPageCustomId)) {
		return { customIdArgs, owner, selectedCategoryPageIndex, selectedCategory, selectedMacroPageIndex } as Args<false>;
	}

	const selectedMacro = customIdArgs?.name ?? getSelectedOrDefault(sageCommand, createCustomId("selectMacro"), "name");

	const macroMeta = getMacroMeta(owner, selectedMacro);
	if (macroMeta) return { customIdArgs, owner, ...macroMeta };

	const categoryMeta = getCategoryMeta(owner, selectedCategory);
	if (categoryMeta) return { customIdArgs, owner, ...categoryMeta } as Args<false>;

	return { customIdArgs, owner, selectedCategoryPageIndex, selectedCategory, selectedMacroPageIndex, selectedMacro } as Args<false>;
}