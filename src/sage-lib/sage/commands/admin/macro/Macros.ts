import { partition, sortByKey, sortPrimitive, toUniqueDefined } from "@rsc-utils/array-utils";
import type { Snowflake } from "@rsc-utils/core-utils";
import { DiscordMaxValues } from "@rsc-utils/discord-utils";
import { StringMatcher } from "@rsc-utils/string-utils";
import type { Bot } from "../../../model/Bot.js";
import type { Game } from "../../../model/Game.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { Server } from "../../../model/Server.js";
import type { User } from "../../../model/User.js";
import { Macro, type MacroBase, type MacroOrBase } from "./Macro.js";
import type { MacroOwner, MacroOwnerTypeKey } from "./Owner.js";
import { isUncategorized, Uncategorized } from "./Uncategorized.js";

type HasMacros<Category extends string = string> = {
	macros: MacroBase<Category>[];
	save(): Promise<boolean>;
}

type THasMacros = GameCharacter | User | Game | Server | Bot;

export type CategoryIndex = {
	categoryPageIndex: number;
	categoryIndex: number;
}

export type MacroIndex = CategoryIndex & {
	macroPageIndex: number;
	macroIndex: number;
}

type CategoryPageMeta<Category extends string = string> = {
	categoryPageIndex: number;
	categories: CategoryMeta<Category>[];
}

export type CategoryMeta<Category extends string = string> = CategoryIndex & {
	category: Category | Uncategorized;
	macroPages: MacroPageMeta<Category>[];
}

type MacroPageMeta<Category extends string = string> = Omit<CategoryMeta<Category>, "macroPages"> & {
	macroPageIndex: number;
	macros: MacroMeta<Category>[];
}

export type MacroMeta<Category extends string = string> = Omit<CategoryMeta<Category>, "macroPages"> & MacroIndex & {
	macro: Macro<Category>;
}

export class Macros<Category extends string = string> {

	public categoryMap!: Map<string, CategoryMeta<Category>>;
	public macroMap!: Map<string, MacroMeta<Category>>;
	public tree!: CategoryPageMeta<Category>[];
	public get type() { return this.owner.type; }

	public constructor(private hasMacros: HasMacros<Category>, private owner: MacroOwner) {
		this.mapMacros();
	}

	private mapMacros(): void {
		// create / sort macros
		const { owner } = this;
		const macros = this.hasMacros.macros?.map(macro => new Macro(macro, owner)) ?? [];
		macros.sort(sortByKey("category", "name"));

		// create / sort categories
		const categories = macros.map(({ category }) => category).filter(toUniqueDefined).filter(category => !isUncategorized(category));
		categories.sort(sortPrimitive);
		categories.unshift(Uncategorized as Category);

		// paginate macros
		const macroMap = new Map<string, MacroMeta<Category>>();
		const categoryMap = new Map<string, CategoryMeta<Category>>();
		const categoryPages = partition(categories, (_, index) => Math.floor(index / Macros.PageSize));
		const tree = categoryPages.map((categoryPage, categoryPageIndex) => {
			const categories = categoryPage.map((category, categoryIndex) => {
				const categoryMacros = macros.filter(macro => (category === Uncategorized && !macro.category) || (category === macro.category));
				const categoryMacroPages = partition(categoryMacros, (_, index) => Math.floor(index / Macros.PageSize));
				const macroPages = categoryMacroPages.map((macroPage, macroPageIndex) => {
					const macros = macroPage.map((macro, macroIndex) => {
						const macroMeta = { categoryPageIndex, categoryIndex, category, macroPageIndex, macroIndex, macro } as MacroMeta<Category>;
						macroMap.set(StringMatcher.from(macro.name).matchValue, macroMeta);
						return macroMeta;
					});
					return { categoryPageIndex, categoryIndex, category, macroPageIndex, macros } as MacroPageMeta<Category>;
				});
				const categoryMeta = { categoryPageIndex, categoryIndex, category, macroPages } as CategoryMeta<Category>;
				categoryMap.set(StringMatcher.from(category).matchValue, categoryMeta);
				return categoryMeta;
			});
			return { categoryPageIndex, categories } as CategoryPageMeta<Category>;
		});

		// save mapped values
		this.categoryMap = categoryMap;
		this.macroMap = macroMap;
		this.tree = tree;
	}

	public hasMacro(name: string): boolean {
		const nameMatcher = StringMatcher.from(name);
		if (nameMatcher.isNonNil) {
			return this.macroMap.has(nameMatcher.matchValue);
		}
		return false;
	}

	/** Uses StringMatchers to find a Macro. */
	public find(name: string): Macro<Category> | undefined {
		const nameMatcher = StringMatcher.from(name);
		if (nameMatcher.isNonNil) {
			return this.macroMap.get(nameMatcher.matchValue)?.macro;
		}
		return undefined;
	}

	public findCategoryMeta(category: string | undefined): CategoryMeta<Category> | undefined {
		const categoryMatcher = StringMatcher.from(Macro.cleanCategory(category) ?? Uncategorized);
		if (categoryMatcher.isNonNil) {
			return this.categoryMap.get(categoryMatcher.matchValue);
		}
		return undefined;
	}

	public findMacroMeta(name: string | undefined): MacroMeta<Category> | undefined {
		const nameMatcher = StringMatcher.from(name);
		if (nameMatcher.isNonNil) {
			return this.macroMap.get(nameMatcher.matchValue);
		}
		return undefined;
	}

	public getCategories(): (Category | Uncategorized)[][];
	public getCategories(indexes: Omit<CategoryIndex, "categoryIndex">): (Category | Uncategorized)[];
	public getCategories(indexes?: Omit<CategoryIndex, "categoryIndex">) {
		const pagedCategories = this.tree.map(categoryPage => categoryPage.categories.map(({ category }) => category));
		if (indexes) {
			return pagedCategories[indexes.categoryPageIndex] ?? [];
		}
		return pagedCategories;
	}

	public showCategoryPages(): boolean {
		return this.getCategoryPageCount() > 1;
	}
	public showCategories(): boolean {
		return this.categoryMap.size > 0;
	}
	public showMacroPages(indexes: CategoryIndex): boolean {
		const categoryMeta = this.getCategoryMeta(indexes);
		if (categoryMeta) {
			return categoryMeta.macroPages.length > 1;
		}
		return false;
	}
	public showMacros(indexes: MacroIndex): boolean {
		const macroPage = this.getMacroPage(indexes);
		if (macroPage) {
			return macroPage.macros.length > 0;
		}
		return false;
	}

	public getCategoryPages(): CategoryPageMeta<Category>[] {
		return this.tree;
	}
	public getCategoryPageCount(): number {
		return this.tree.length;
	}

	public getCategoryPage(indexes: CategoryIndex): CategoryPageMeta<Category> | undefined {
		return this.getCategoryPages()[Math.max(0, indexes.categoryPageIndex)];
	}

	public getCategoryMeta(indexes: CategoryIndex): CategoryMeta<Category> | undefined {
		return this.getCategoryPage(indexes)?.categories[Math.max(0, indexes.categoryIndex)];
	}
	public getCategory(indexes: CategoryIndex): Category | Uncategorized | undefined {
		return this.getCategoryPage(indexes)?.categories[indexes.categoryIndex]?.category;
	}

	public getMacroPages(indexes: CategoryIndex): MacroPageMeta<Category>[] {
		return this.getCategoryMeta(indexes)?.macroPages ?? [];
	}
	public getMacroPageCount(indexes: CategoryIndex): number {
		return this.getCategoryMeta(indexes)?.macroPages.length ?? 0;
	}

	public getMacroPage(indexes: MacroIndex): MacroPageMeta<Category> | undefined {
		return this.getMacroPages(indexes)[Math.max(0, indexes.macroPageIndex)];
	}

	public getMacroMetas(indexes: MacroIndex): MacroMeta<Category>[] {
		return this.getMacroPage(indexes)?.macros ?? [];
	}
	public getMacroMeta(indexes: MacroIndex): MacroMeta<Category> | undefined {
		return this.getMacroMetas(indexes)[indexes.macroIndex];
	}
	public getMacros(indexes: MacroIndex): Macro<Category>[] {
		return this.getMacroMetas(indexes).map(({ macro }) => macro);
	}
	public getMacro(indexes: MacroIndex): Macro<Category> | undefined {
		return this.getMacroMeta(indexes)?.macro;
	}

	public async removeAndSave(macro: MacroOrBase<Category>): Promise<boolean> {
		macro = "toJSON" in macro ? macro.toJSON() : macro;
		const { hasMacros } = this;
		const { macros } = hasMacros;
		const baseMacroIndex = macros.findIndex(base => base.category === macro.category && base.name === macro.name);
		if (baseMacroIndex > -1) {
			macros.splice(baseMacroIndex, 1);
			this.mapMacros();
			return hasMacros.save();
		}
		return false;
	}

	public async addAndSave(macro: MacroOrBase<Category>): Promise<boolean> {
		const existing = this.find(macro.name);
		if (!existing) {
			const { hasMacros } = this;
			hasMacros.macros.push({ name:macro.name, category:Macro.cleanCategory(macro.category), dice:macro.dice });
			this.mapMacros();
			return hasMacros.save();
		}
		return false;
	}

	public async updateAndSave({ oldMacro, newMacro }: { oldMacro: MacroOrBase<Category>, newMacro: MacroBase<Category> }): Promise<boolean> {
		const macro = this.find(oldMacro.name);
		if (macro) {
			const { hasMacros } = this;
			const baseMacro = hasMacros.macros.find(base => macro.namesMatch(base.name));
			if (baseMacro) {
				baseMacro.category = newMacro.category;
				baseMacro.dice = newMacro.dice;
				baseMacro.name = newMacro.name;
				this.mapMacros();
				return hasMacros.save();
			}
		}
		return false;
	}

	public toJSON(): MacroBase[] {
		return this.hasMacros.macros;
	}

	public static async find(_sageCommand: SageCommand, _args: unknown): Promise<MacroBase | undefined> {
		return undefined;
		// const macros = await Macros.parse(sageCommand, args);
		// return macros.find(args);
	}

	public static from(hasMacros: THasMacros): Macros {
		const id = "did" in hasMacros ? hasMacros.did : hasMacros.id as Snowflake;
		let type: MacroOwnerTypeKey;
		if ("objectType" in hasMacros) {
			switch(hasMacros.objectType) {
				case "Game": type = "game"; break;
				case "Server": type = "server"; break;
				case "Bot": type = "global"; break;
				case "User":
				default: type = "user"; break;
			}
		}else {
			type = "character";
		}
		/** @todo when these objects all have macros, fix this cast and the THasMacros type */
		return new Macros(hasMacros as unknown as HasMacros, { id, type });
	}

	public static async parse(sageCommand: SageCommand, owner?: MacroOwner): Promise<Macros | undefined> {
		const ownerType = owner?.type;
		const ownerId = owner?.id;
		switch(ownerType) {
			case "character": {
				if (ownerId) {
					const shell = sageCommand.game?.findCharacterOrCompanion(ownerId)
						?? sageCommand.sageUser.findCharacterOrCompanion(ownerId);
					if (shell) {
						const character = "game" in shell ? shell.game : shell;
						if (character) {
							return Macros.from(character);
						}
					}
				}
				break;
			};
			case "user": {
				const { actorId } = sageCommand;
				const ensuredOwnerId = ownerId ?? actorId;
				const user = ensuredOwnerId === actorId
					? sageCommand.sageUser
					: await sageCommand.sageCache.users.getByDid(ensuredOwnerId);
				if (user) {
					return Macros.from(user);
				}
				break;
			};
			case "game": {
				if (sageCommand.game) {
					return Macros.from(sageCommand.game);
				}
				break;
			};
			case "server": {
				if (sageCommand.server) {
					return Macros.from(sageCommand.server);
				}
				break;
			};
			case "global": {
				if (sageCommand.bot) {
					return Macros.from(sageCommand.bot);
				}
				break;
			};
			default: {
				break;
			};
		}
		return undefined;
	}

	public static get PageSize(): number {
		return DiscordMaxValues.component.select.optionCount;
	}
}
