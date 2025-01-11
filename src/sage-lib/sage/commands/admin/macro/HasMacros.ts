import { sortByKey, sortPrimitive, toUniqueDefined } from "@rsc-utils/array-utils";
import { NIL_SNOWFLAKE, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordMaxValues } from "@rsc-utils/discord-utils";
import { StringMatcher } from "@rsc-utils/string-utils";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { User } from "../../../model/User.js";
import { createCustomId, Uncategorized, type CustomIdArgs } from "./customId.js";
import { getMacroType } from "./getMacroType.js";
import { getPages } from "./getPage.js";

export type MacroType = "dice" | "items" | "math" | "table" | "tableUrl";

/** @todo add: character, game, server, global */
export type MacroOwnerType = "user";

type MacroBase<Category extends string = string> = {
	category?: Category;
	dice: string;
	name: string;
};

type MacroBaseOwner<Category extends string = string> = {
	macros: MacroBase<Category>[];
	save(): Promise<boolean>;
}

export type Macro<Category extends string = string> = MacroBase<Category> & {
	ownerId: Snowflake;
	ownerType: MacroOwnerType;
	type: MacroType;
};

type CategoryArgs = {
	category?: string;
	selectedCategory?: string;
}
type MacroArgs = {
	category?: string;
	name?: string;
	selectedMacro?: string;
	selectedCategory?: string;
};

type ParseArgs = {
	ownerType: MacroOwnerType;
	/** used when selecting a character */
	ownerId?: Snowflake;
};

export class HasMacros<Category extends string = string> {

	public id: Snowflake;
	public categories: Category[];
	public categoryPages: Category[][];
	public categoryPageCount: number;
	public macros: Macro<Category>[];
	public macroPages: Record<Category, Macro<Category>[][]>;
	public macroCounts: Record<Category, number>;
	public macroPageCounts: Record<Category, number>;
	private owner: MacroBaseOwner<Category>;
	public type: MacroOwnerType;

	public constructor(id: Snowflake, owner: MacroBaseOwner<Category>, type: MacroOwnerType) {
		// set simple values
		this.id = id;
		this.owner = owner;
		this.type = type;

		// create / sort macros
		this.macros = owner.macros.map(macro => (
			{ ...macro, ownerId:id, ownerType:type, type:getMacroType(macro.dice) }
		));
		this.macros.sort(sortByKey("category", "name"));

		// create / sort categories
		this.categories = this.macros.map(({ category }) => category).filter(toUniqueDefined);
		this.categories.sort(sortPrimitive);
		this.categories.unshift(Uncategorized as Category);

		// calculate meta data
		const pageSize = HasMacros.PageSize;

		this.categoryPages = getPages(this.categories, pageSize);
		this.categoryPageCount = this.categoryPages.length;

		this.macroPages = {} as Record<Category, Macro<Category>[][]>;
		this.macroCounts = {} as Record<Category, number>;
		this.macroPageCounts = {} as Record<Category, number>;
		this.categories.forEach(category => {
			const catMacros = this.macros.filter(macro => (category === Uncategorized && !macro.category) || (category === macro.category));
			const catMacroPages = getPages(catMacros, pageSize);
			this.macroPages[category] = catMacroPages;
			this.macroCounts[category] = catMacros.length;
			this.macroPageCounts[category] = catMacroPages.length;
		});
	}

	public createCustomId(args: Omit<CustomIdArgs, "indicator" | "ownerId" | "type">): string {
		return createCustomId({ ownerId:this.id, type:this.type, ...args });
	}

	/** Uses StringMatchers to find a Macro. */
	public find({ category, name, selectedCategory, selectedMacro }: MacroArgs): Macro<Category> | undefined {
		const nameMatcher = StringMatcher.from(name ?? selectedMacro);
		if (!nameMatcher.isNonNil) {
			return undefined;
		}

		const categoryMatcher = StringMatcher.from(category ?? selectedCategory);
		if (categoryMatcher.isNonNil) {
			return this.macros.find(macro => categoryMatcher.matches(macro.category) && nameMatcher.matches(macro.name));
		}

		return this.macros.find(macro => nameMatcher.matches(macro.name));
	}

	public getCategoryMeta({ category, selectedCategory }: CategoryArgs) {
		const categoryMatcher = StringMatcher.from(category ?? selectedCategory);
		if (categoryMatcher.isNonNil) {
			for (let categoryPageIndex = 0; categoryPageIndex < this.categoryPageCount; categoryPageIndex++) {
				const page = this.categoryPages[categoryPageIndex];
				const categoryIndex = page.findIndex(cat => categoryMatcher.matches(cat));
				if (categoryIndex > -1) {
					return {
						category: page[categoryIndex],
						categoryIndex,
						categoryPageIndex,
					};
				}
			}
		}
		return undefined;
	}

	public getMacroMeta(args: MacroArgs) {
		const macro = this.find(args);
		if (macro) {
			const pages = this.macroPages[macro.category ?? Uncategorized as Category];
			for (let macroPageIndex = 0; macroPageIndex < pages.length; macroPageIndex++) {
				const page = pages[macroPageIndex];
				const macroIndex = page.indexOf(macro);
				if (macroIndex > -1) {
					return {
						...this.getCategoryMeta(macro),
						macro,
						macroIndex,
						macroPageIndex,
					};
				}
			}
		}
		return undefined;
	}

	public getCategories(pageIndex: number): string[] {
		// negative numbers imply starting from the end
		if (pageIndex < 0) {
			pageIndex = this.categoryPageCount + pageIndex;
		}

		return this.categoryPages[pageIndex] ?? [];
	}

	public getMacros({ category, pageIndex }: { category: string, pageIndex: number }) {
		const pages = this.macroPages[category as Category] ?? [];

		// negative numbers imply starting from the end
		if (pageIndex < 0) {
			pageIndex = pages.length + pageIndex;
		}

		const macros = pages[pageIndex] ?? [];

		return {
			// category,
			// macroCount: macros.length,
			macros,
			pageCount: pages.length,
			pageIndex,
		}
	}

	public async removeAndSave(macro: Macro<Category>): Promise<boolean> {
		const baseMacros = this.owner.macros;
		const baseMacroIndex = baseMacros.findIndex(base => base.category === macro.category && base.name === macro.name);
		if (baseMacroIndex > -1) {
			baseMacros.splice(baseMacroIndex, 1);
			return this.owner.save();
		}
		return false;
	}
	public async updateAndSave({ oldMacro, newMacro }: { oldMacro: Macro<Category>, newMacro: Macro<Category> }): Promise<boolean> {
		const baseMacro = this.owner.macros.find(base => base.category === oldMacro.category && base.name === oldMacro.name);
		if (baseMacro) {
			baseMacro.category = newMacro.category;
			baseMacro.dice = newMacro.dice;
			baseMacro.name = newMacro.name;
			return this.owner.save();
		}
		return false;
	}

	public static async find(sageCommand: SageCommand, args: MacroArgs & ParseArgs): Promise<Macro | undefined> {
		const owner = await HasMacros.parse(sageCommand, args);
		return owner.find(args);
	}

	public static from(owner: User): HasMacros {
		return new HasMacros(owner.did, owner, "user");
	}

	public static async parse(sageCommand: SageCommand, args: ParseArgs): Promise<HasMacros> {
		/** @todo fix these default values when we add more ownerType options */
		const { ownerType = "user", ownerId = sageCommand.actorId } = args;
		switch(ownerType) {
			case "user":
				const user = ownerId === sageCommand.actorId
					? sageCommand.sageUser
					: await sageCommand.sageCache.users.getByDid(ownerId);
				if (user) {
					return HasMacros.from(user);
				}
				break;
			default:
				break;
		}
		return new HasMacros(ownerId ?? NIL_SNOWFLAKE, { macros:[], save:() => Promise.resolve(false) }, ownerType);
	}

	public static get PageSize(): number {
		return DiscordMaxValues.component.select.optionCount;
	}
}
