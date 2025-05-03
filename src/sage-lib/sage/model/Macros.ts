import { partition, sortByKey, sortPrimitive, toUniqueDefined, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordMaxValues } from "@rsc-utils/discord-utils";
import { StringMatcher } from "@rsc-utils/string-utils";
import type { Bot } from "./Bot.js";
import type { Game } from "./Game.js";
import type { GameCharacter } from "./GameCharacter.js";
import { Macro, Uncategorized, type MacroBase, type MacroOrBase } from "./Macro.js";
import { MacroOwner, type MacroOwnerTypeKey, type TMacroOwner } from "./MacroOwner.js";
import type { SageCommand } from "./SageCommand.js";
import type { Server } from "./Server.js";
import type { User } from "./User.js";

export type FindMacrosAndMacroResult = { macros:Macros; macroMeta:MacroMeta; categoryMeta:CategoryMeta; };
type FindMacrosAndCategoryResult = { macros:Macros; categoryMeta:CategoryMeta; };

/** Navigates the macro tiers of the given SageCommand, looking for something via the given handler. */
function navigateTiers<T>(sageCommand: SageCommand, handler: (hasMacros?: THasMacros) => T | undefined): T | undefined {
	const pcs = sageCommand.game?.playerCharacters.filterByUser(sageCommand.actorId)
		?? sageCommand.sageUser.playerCharacters;

	for (const pc of pcs) {
		const pcResult = handler(pc);
		if (pcResult) return pcResult;

		for (const comp of pc.companions) {
			const compResult = handler(comp);
			if (compResult) return compResult;
		}
	}

	const userResult = handler(sageCommand.sageUser);
	if (userResult) return userResult;

	const gameResult = handler(sageCommand.game);
	if (gameResult) return gameResult;

	const serverResult = handler(sageCommand.server);
	if (serverResult) return serverResult;

	const botResult = handler(sageCommand.bot);
	if (botResult) return botResult;

	return undefined;
}

type HasMacros<Category extends string = string> = {
	macros: MacroBase<Category>[];
	save(): Promise<boolean>;
}

type THasMacros = GameCharacter | User | Game | Server | Bot;

type CategoryPageIndex = {
	categoryPageIndex: number;
}

export type CategoryIndex = CategoryPageIndex & {
	categoryIndex: number;
}

export type MacroIndex = CategoryIndex & {
	macroPageIndex: number;
	macroIndex: number;
}

type CategoryPageMeta<Category extends string = string> = CategoryPageIndex & {
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

export function findCharacterOrCompanion(sageCommand: SageCommand, charAliasOrIdOrName: Optional<string>): GameCharacter | undefined {
	if (charAliasOrIdOrName) {
		const shell = sageCommand.game?.findCharacterOrCompanion(charAliasOrIdOrName)
			?? sageCommand.sageUser.findCharacterOrCompanion(charAliasOrIdOrName);
		if (shell) {
			return "game" in shell ? shell.game : shell;
		}
	}
	return undefined;
}

export class Macros<Category extends string = string> {

	public categoryMap!: Map<string, CategoryMeta<Category>>;
	public macroMap!: Map<string, MacroMeta<Category>>;
	public tree!: CategoryPageMeta<Category>[];
	public get isEmpty() { return this.macroMap.size === 0; }
	public get size() { return this.macroMap.size; }
	public get type() { return this.owner.type; }
	public get typeKey() { return this.owner.typeKey; }

	public constructor(private hasMacros: HasMacros<Category>, public owner: MacroOwner) {
		this.mapMacros();
	}

	/** Creates the tree of macros along with the category and macro maps. */
	private mapMacros(): void {
		const { isUncategorized } = Macro;
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
				const categoryMacros = isUncategorized(category)
					? macros.filter(macro => macro.isUncategorized)
					: macros.filter(macro => category === macro.category);
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

	/** Uses StringMatcher to find the given macro category. Returns true if found. */
	public hasCategory(category?: string): boolean {
		const categoryMatcher = StringMatcher.from(category);
		if (categoryMatcher.isNonNil) {
			return this.categoryMap.has(categoryMatcher.matchValue);
		}
		return false;
	}

	/** Uses StringMatcher to find the Macro for the given macro name. Returns true if found. */
	public hasMacro(name: string | undefined): boolean {
		const nameMatcher = StringMatcher.from(name);
		if (nameMatcher.isNonNil) {
			return this.macroMap.has(nameMatcher.matchValue);
		}
		return false;
	}

	/** Users StringMatchers to find the Macro for the given macro name. */
	public find(name: string | undefined): Macro<Category> | undefined {
		const nameMatcher = StringMatcher.from(name);
		if (nameMatcher.isNonNil) {
			return this.macroMap.get(nameMatcher.matchValue)?.macro;
		}
		return undefined;
	}

	/** Users StringMatchers to find the CategoryMeta for the given category. */
	public findCategoryMeta(category: string | undefined): CategoryMeta<Category> | undefined {
		const categoryMatcher = StringMatcher.from(Macro.cleanCategory(category) ?? Uncategorized);
		if (categoryMatcher.isNonNil) {
			return this.categoryMap.get(categoryMatcher.matchValue);
		}
		return undefined;
	}

	/** Users StringMatchers to find the MacroMeta for the given macro name. */
	public findMacroMeta(name: string | undefined): MacroMeta<Category> | undefined {
		const nameMatcher = StringMatcher.from(name);
		if (nameMatcher.isNonNil) {
			return this.macroMap.get(nameMatcher.matchValue);
		}
		return undefined;
	}

	/** Returns all the categories partitioned into pages. */
	public getCategories(): (Category | Uncategorized)[][];
	/** Returns all the categories for the given CategoryPageIndex. */
	public getCategories(indexes: CategoryPageIndex): (Category | Uncategorized)[];
	public getCategories(indexes?: CategoryPageIndex) {
		const pagedCategories = this.tree.map(categoryPage => categoryPage.categories.map(({ category }) => category));
		if (indexes) {
			return pagedCategories[indexes.categoryPageIndex] ?? [];
		}
		return pagedCategories;
	}

	/** Returns all category pages. */
	public getCategoryPages(): CategoryPageMeta<Category>[] {
		return this.tree;
	}

	/** Returns the count of all category pages. */
	public getCategoryPageCount(): number {
		return this.tree.length;
	}

	/**
	 * Uses getCategoryPages() to return the category page for the given CategoryPageIndex.
	 * If categoryPageIndex is -1, then index 0 is used instead.
	 */
	public getCategoryPage(indexes: CategoryPageIndex): CategoryPageMeta<Category> | undefined {
		return this.getCategoryPages()[Math.max(0, indexes.categoryPageIndex)];
	}

	/**
	 * Uses getCategoryPage(indexes) to return the category meta for the given CategoryIndex.
	 * If categoryPageIndex is -1, then index 0 is used instead.
	 * If getCategoryPage(indexes) returns undefined, undefined is returned.
	 * If categoryIndex is -1, then index 0 is used instead.
	 */
	public getCategoryMeta(indexes: CategoryIndex): CategoryMeta<Category> | undefined {
		return this.getCategoryPage(indexes)?.categories[Math.max(0, indexes.categoryIndex)];
	}

	/**
	 * Uses getCategoryPage(indexes) to return the category for the given CategoryIndex.
	 * If categoryPageIndex is -1, then index 0 is used instead.
	 * If getCategoryPage(indexes) returns undefined, undefined is returned.
	 */
	public getCategory(indexes: CategoryIndex): Category | Uncategorized | undefined {
		return this.getCategoryPage(indexes)?.categories[indexes.categoryIndex]?.category;
	}

	/**
	 * Uses getCategoryMeta(indexes) to return the macro pages for the given CategoryIndex.
	 * If categoryPageIndex is -1, then index 0 is used instead.
	 * If categoryIndex is -1, then index 0 is used instead.
	 * If getCategoryMeta(indexes) returns undefined, an empty array is returned.
	 */
	public getMacroPages(indexes: CategoryIndex): MacroPageMeta<Category>[] {
		return this.getCategoryMeta(indexes)?.macroPages ?? [];
	}

	/**
	 * Uses getCategoryMeta(indexes) to return the count of macro pages for the given CategoryIndex.
	 * If categoryPageIndex is -1, then index 0 is used instead.
	 * If categoryIndex is -1, then index 0 is used instead.
	 * If getCategoryMeta(indexes) returns undefined, 0 is returned.
	 */
	public getMacroPageCount(indexes: CategoryIndex): number {
		return this.getCategoryMeta(indexes)?.macroPages.length ?? 0;
	}

	/**
	 * Uses getMacroPages(indexes) to return the macro page for the given MacroIndex.
	 * If categoryPageIndex is -1, then index 0 is used instead.
	 * If categoryIndex is -1, then index 0 is used instead.
	 * If getMacroPages(indexes) returns undefined, undefined is returned.
	 * If macroPageIndex is -1, then index 0 is used instead.
	 */
	public getMacroPage(indexes: MacroIndex): MacroPageMeta<Category> | undefined {
		return this.getMacroPages(indexes)[Math.max(0, indexes.macroPageIndex)];
	}

	/**
	 * Uses getMacroPage(indexes) to return the macro meta array for the given MacroIndex.
	 * If categoryPageIndex is -1, then index 0 is used instead.
	 * If categoryIndex is -1, then index 0 is used instead.
	 * If getMacroPages(indexes) returns undefined, undefined is returned.
	 * If macroPageIndex is -1, then index 0 is used instead.
	 * if getMacroPage(indexes) returns undefined, an empty array is returned.
	 */
	public getMacroMetas(indexes: MacroIndex): MacroMeta<Category>[] {
		return this.getMacroPage(indexes)?.macros ?? [];
	}

	/**
	 * Uses getMacroMetas(indexes) to return the macro meta for the given MacroIndex.
	 * If categoryPageIndex is -1, then index 0 is used instead.
	 * If categoryIndex is -1, then index 0 is used instead.
	 * If getMacroPages(indexes) returns undefined, undefined is returned.
	 * If macroPageIndex is -1, then index 0 is used instead.
	 */
	public getMacroMeta(indexes: MacroIndex): MacroMeta<Category> | undefined {
		return this.getMacroMetas(indexes)[indexes.macroIndex];
	}

	/**
	 * Uses getMacroPage(indexes) to return the macro array for the given MacroIndex.
	 * If categoryPageIndex is -1, then index 0 is used instead.
	 * If categoryIndex is -1, then index 0 is used instead.
	 * If getMacroPages(indexes) returns undefined, undefined is returned.
	 * If macroPageIndex is -1, then index 0 is used instead.
	 * if getMacroPage(indexes) returns undefined, an empty array is returned.
	 */
	public getMacros(indexes: MacroIndex): Macro<Category>[] {
		return this.getMacroMetas(indexes).map(({ macro }) => macro);
	}

	/**
	 * Uses getMacroMeta(indexes) to return the macro for the given MacroIndex.
	 * If categoryPageIndex is -1, then index 0 is used instead.
	 * If categoryIndex is -1, then index 0 is used instead.
	 * If getMacroPages(indexes) returns undefined, undefined is returned.
	 * If macroPageIndex is -1, then index 0 is used instead.
	 */
	public getMacro(indexes: MacroIndex): Macro<Category> | undefined {
		return this.getMacroMeta(indexes)?.macro;
	}

	/** Returns true if there are more than one category page. */
	public shouldShowCategoryPages(): boolean {
		return this.getCategoryPageCount() > 1;
	}

	/** Returns true if there are more than one category. */
	public shouldShowCategories(): boolean {
		return this.categoryMap.size > 0;
	}

	/** Returns true if there are more than one page of macros for the given category. */
	public shouldShowMacroPages(indexes: CategoryIndex): boolean {
		const categoryMeta = this.getCategoryMeta(indexes);
		if (categoryMeta) {
			return categoryMeta.macroPages.length > 1;
		}
		return false;
	}

	/** Returns true if there are macros for the given macro page. */
	public shouldShowMacros(indexes: MacroIndex): boolean {
		const macroPage = this.getMacroPage(indexes);
		if (macroPage) {
			return macroPage.macros.length > 0;
		}
		return false;
	}

	public canActorEdit(sageCommand: SageCommand): boolean {
		switch(this.type) {
			case "global": return sageCommand.isSuperUser;
			case "server": return this.owner.id === sageCommand.server?.id && sageCommand.canManageServer;
			case "game": return this.owner.id === sageCommand.game?.id && sageCommand.canAdminGame;
			case "user": return this.owner.id === sageCommand.actorId;
			case "character": return sageCommand.findCharacter(this.owner.id)?.userDid === sageCommand.actorId;
			default: return false;
		}
	}

	public async addAndSave(macro: MacroOrBase<Category>): Promise<boolean> {
		const existing = this.find(macro.name);
		if (!existing) {
			const { hasMacros } = this;
			hasMacros.macros.push({ name:macro.name, category:Macro.cleanCategory(macro.category), dialog:macro.dialog, dice:macro.dice });
			this.mapMacros();
			return hasMacros.save();
		}
		return false;
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

	public async removeAllAndSave(): Promise<boolean> {
		const { hasMacros } = this;
		const { macros } = hasMacros;
		if (macros.length > 0) {
			macros.length = 0;
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
				baseMacro.dialog = newMacro.dialog;
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

	public getCharSheetMacros(): MacroBase[] {
		const macros: MacroBase[] = [];
		const matcher = StringMatcher.from("CharSheet");
		const macroMetas = this.macroMap.values();
		for (const meta of macroMetas) {
			if (matcher.matches(meta.category)) {
				macros.push(meta.macro.toJSON());
			}
		}
		return macros;
	}

	/** Navigate up the macro tiers to find the Macros/owner and CategoryMeta/MacroMeta for the given macro name. */
	public static findMacrosAndMacro(sageCommand: SageCommand, name?: string): FindMacrosAndMacroResult | undefined {
		// early exit
		if (!name) return undefined;

		return navigateTiers(sageCommand, (hasMacros?: THasMacros) => {
			const macros = Macros.from(hasMacros);

			// save time if we have no macros to search
			if (!macros) return undefined;

			// look for macro
			const macroMeta = macros?.findMacroMeta(name);

			// no result if we have no macro
			if (!macroMeta) return undefined;

			// get macro's category if we find a macro.
			const categoryMeta = macros.getCategoryMeta(macroMeta)!;

			// return result
			return { macros, macroMeta, categoryMeta };
		});
	}

	/** Navigate up the macro tiers to find the Macros/owner and CategoryMeta for the given category. */
	public static findMacrosAndCategory(sageCommand: SageCommand, category?: string): FindMacrosAndCategoryResult | undefined {
		// early exit
		if (!category) return undefined;

		return navigateTiers(sageCommand, (hasMacros?: THasMacros) => {
			const macros = Macros.from(hasMacros);

			// save time if we have no macros to search
			if (!macros) return undefined;

			// look for category
			const categoryMeta = macros.findCategoryMeta(category);

			// no result if we have no category
			if (!categoryMeta) return undefined;

			return { macros, categoryMeta };
		});
	}

	/** Creates a Macros instance from one of the objects that has a .macros array. */
	public static from(hasMacros?: THasMacros): Macros | undefined {
		if (!hasMacros) return undefined;

		const id = "did" in hasMacros ? hasMacros.did : hasMacros.id as Snowflake;
		let name = "name" in hasMacros ? hasMacros.name : hasMacros.objectType === "User" ? "@Me" : "RPG Sage";
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
		return new Macros(hasMacros as HasMacros, new MacroOwner(id, name, type));
	}

	/** Searches for the macro owner based on owner type and id. */
	public static async parse(sageCommand: SageCommand, owner?: TMacroOwner): Promise<Macros | undefined> {
		const ownerType = owner?.type;
		const ownerId = owner?.id;
		switch(ownerType) {
			case "character": {
				if (ownerId) {
					const character = findCharacterOrCompanion(sageCommand, ownerId);
					if (character) {
						return Macros.from(character);
					}
				}
				break;
			};
			case "user": {
				const { actorId } = sageCommand;
				const ensuredOwnerId = ownerId ?? actorId;
				const user = ensuredOwnerId === actorId
					? sageCommand.sageUser
					: await sageCommand.sageCache.users.getById(ensuredOwnerId);
				if (user) {
					return Macros.from(user);
				}
				break;
			};
			case "game": return Macros.from(sageCommand.game);
			case "server": return Macros.from(sageCommand.server);
			case "global": return Macros.from(sageCommand.bot);
			default: return undefined;
		}
		return undefined;
	}

	/** Convenience for DiscordMaxValues.component.select.optionCount */
	public static readonly PageSize = DiscordMaxValues.component.select.optionCount;
}
