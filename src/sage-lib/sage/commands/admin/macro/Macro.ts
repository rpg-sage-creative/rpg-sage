import type { Optional } from "@rsc-utils/core-utils";
import { isUrl } from "@rsc-utils/io-utils";
import { StringMatcher, stringOrUndefined, unwrap } from "@rsc-utils/string-utils";
import { getBasicDiceRegex } from "../../../../../sage-dice/getBasicDiceRegex.js";
import { isMath } from "../../dice/isMath.js";
import { isRandomItem } from "../../dice/isRandomItem.js";
import { isValidTable } from "../../dice/isValidTable.js";
import { parseTable } from "../../dice/parseTable.js";
import type { MacroIndex } from "./Macros.js";
import type { MacroOwner } from "./Owner.js";
import { isUncategorized, Uncategorized } from "./Uncategorized.js";

export type MacroOrBase<Category extends string = string> = MacroBase<Category> | Macro<Category>;

export type MacroBase<Category extends string = string> = {
	category?: Category;
	dice: string;
	name: string;
};

export type MacroType = "dice" | "items" | "math" | "table" | "tableUrl";

export class Macro<Category extends string = string> {

	private base: MacroBase<Category>;

	public constructor({ name, category, dice }: MacroBase<Category>, public owner: MacroOwner) {
		this.base = { name, category:Macro.cleanCategory(category), dice };
	}

	public get category(): Category | Uncategorized {
		return this.base.category ?? Uncategorized;
	}
	public set category(category: Category | Uncategorized) {
		this.base.category = Macro.cleanCategory(category);
		delete this._categoryMatcher;
	}

	public get dice(): string {
		return this.base.dice;
	}
	public set dice(dice: string) {
		this.base.dice = dice;
		delete this._type;
	}

	public get isUncategorized(): boolean {
		return !this.base.category;
	}

	public get name(): string {
		return this.base.name;
	}
	public set name(name: string) {
		this.base.name = name;
		delete this._nameMatcher;
	}

	private _type?: MacroType;
	public get type(): MacroType {
		if (!this._type) {
			this._type = Macro.getType(this.dice);
		}
		return this._type!;
	}

	private _categoryMatcher?: StringMatcher;
	public categoriesMatch(other: string | StringMatcher | undefined): boolean {
		if (other === undefined) {
			return this.isUncategorized;
		}
		if (this.isUncategorized) {
			if (typeof(other) === "string") {
				return !Macro.cleanCategory(other);
			}
			return !Macro.cleanCategory(other.matchValue);
		}
		if (!this._categoryMatcher) {
			this._categoryMatcher = StringMatcher.from(this.category);
		}
		return this._categoryMatcher.matches(other);
	}

	/** same name, category, dice ... possibly different case */
	public equals(other: MacroBase): boolean {
		return this.namesMatch(other.name)
			&& this.categoriesMatch(other.category)
			&& this.dice.toLowerCase() === other.dice.toLowerCase();
	}

	/** all values are the exact same */
	public identical(other: MacroBase): boolean {
		return this.category === other.category
			&& this.name === other.name
			&& this.dice === other.dice;
	}

	/** same name and category ... possibly different case */
	public matches(other: MacroBase): boolean {
		return this.namesMatch(other.name)
			&& this.categoriesMatch(other.category);
	}

	private _nameMatcher?: StringMatcher;
	public namesMatch(other: string | StringMatcher): boolean {
		if (!this._nameMatcher) {
			this._nameMatcher = StringMatcher.from(this.name);
		}
		return this._nameMatcher.matches(other);
	}

	public toJSON(): MacroBase<Category> {
		return this.base;
	}

	public static cleanCategory<Category extends string = string>(category: string | undefined): Category | undefined {
		if (isUncategorized(category)) {
			return undefined;
		}
		return stringOrUndefined(category) as Category;
	}

	public static getType(value: Optional<string>): MacroType {
		if (value) {
			if (isUrl(unwrap(value, "[]"))) {
				return "tableUrl";
			}
			if (parseTable(value)) {
				return "table";
			}
			if (isRandomItem(value) && !getBasicDiceRegex().test(value)) {
				return "items";
			}
			if (isMath(value)) {
				return "math";
			}
		}
		return "dice";
	}

	public static updateMacroIndex(indexes: MacroIndex, args: Partial<MacroIndex>): MacroIndex {
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

	public static async validateMacro(macro: MacroBase | Macro): Promise<boolean> {
		const type = "type" in macro ? macro.type : Macro.getType(macro.dice);
		switch(type) {
			case "dice":
				return getBasicDiceRegex().test(macro.dice);
			case "items":
				return true;
			case "math":
				return true;
			case "table":
				return (await isValidTable(macro.dice)) === "table";
			case "tableUrl":
				return (await isValidTable(macro.dice)) === "url";
			default:
				return false;
		}
	}
}