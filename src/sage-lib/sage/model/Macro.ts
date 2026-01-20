import { StringMatcher, stringOrUndefined, unwrap, type Optional } from "@rsc-utils/core-utils";
import { hasDiceMacroArgPlaceholder, hasDiceMacroRemainingArgPlaceholder, isRandomItem, matchesBasicDice, parseDialogContent, parseDiceMacroArgPlaceholdersForModal, type DiceMacroArgPlaceholder, type MacroBase } from "@rsc-utils/game-utils";
import { isUrl } from "@rsc-utils/io-utils";
import { isMath } from "../commands/dice/isMath.js";
import { isValidTable } from "../commands/dice/isValidTable.js";
import { parseTable } from "../commands/dice/parseTable.js";
import type { TMacroOwner } from "./MacroOwner.js";

export type Uncategorized = "Uncategorized";
export const Uncategorized: Uncategorized = "Uncategorized";

export type MacroOrBase<Category extends string = string> = MacroBase<Category> | Macro<Category>;

export type MacroType = "dialog" | "dice" | "items" | "math" | "table" | "tableUrl";

type TypedMacro<Category extends string = string, Type extends MacroType = MacroType> = Macro<Category> & {
	dialog: Type extends "dialog" ? string : undefined;
	dice: Type extends Exclude<MacroType, "dialog"> ? string : undefined;
	type: Type;
};

export class Macro<Category extends string = string> {

	private base: MacroBase<Category>;

	public constructor({ name, category, dialog, dice }: MacroBase<Category>, public owner: TMacroOwner) {
		this.base = {
			name,
			category: Macro.cleanCategory(category),
			dialog: stringOrUndefined(dialog),
			dice: stringOrUndefined(dice)
		};
	}

	public get category(): Category | Uncategorized {
		return this.base.category ?? Uncategorized;
	}
	public set category(category: Category | Uncategorized) {
		this.base.category = Macro.cleanCategory(category);
		delete this._categoryMatcher;
	}

	public get dialog(): string | undefined {
		return this.base.dialog;
	}
	public set dialog(dialog: string | undefined) {
		this.base.dialog = stringOrUndefined(dialog);
		delete this.base.dice;
		delete this._type;
	}

	public get dice(): string | undefined {
		return this.base.dice;
	}
	public set dice(dice: string | undefined) {
		this.base.dice = stringOrUndefined(dice);
		delete this.base.dialog;
		delete this._type;
	}

	public get hasArgs(): boolean {
		if (this.isDice()) {
			return hasDiceMacroArgPlaceholder(this.base.dice);
		}
		return false;
	}

	public get hasRemainingArgs(): boolean {
		if (this.isDice()) {
			return hasDiceMacroRemainingArgPlaceholder(this.base.dice);
		}
		return false;
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
			this._type = Macro.getType(this.dialog ?? this.dice);
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
		if (this.matches(other)) {
			if (this.isDialog()) {
				return this.dialog?.toLowerCase() === other.dialog?.toLowerCase();
			}else {
				return this.dice?.toLowerCase() === other.dice?.toLowerCase();
			}
		}
		return false;
	}

	/** parses dice for {key:defaultValue} pairs ... returns empty string for any other macro type. */
	public getArgPlaceholdersForModal(): DiceMacroArgPlaceholder[] {
		if (this.isDice()) {
			return parseDiceMacroArgPlaceholdersForModal(this.base.dice);
		}
		return [];
	}

	/** all values are the exact same */
	public identical(other: MacroBase): boolean {
		if (this.category === other.category && this.name === other.name) {
			return this.isDialog()
				? this.dialog === other.dialog
				: this.dice === other.dice;
		}
		return false;
	}

	public isDialog(): this is TypedMacro<Category, "dialog"> {
		return this.type === "dialog";
	}

	public isDice(): this is TypedMacro<Category, "dice"> {
		return this.type === "dice";
	}

	public isItems(): this is TypedMacro<Category, "items"> {
		return this.type === "items";
	}

	public isMath(): this is TypedMacro<Category, "math"> {
		return this.type === "math";
	}

	public isTable(): this is TypedMacro<Category, "table"> {
		return this.type === "table";
	}

	public isTableUrl(): this is TypedMacro<Category, "tableUrl"> {
		return this.type === "tableUrl";
	}

	public isType<Type extends MacroType>(...types: Type[]): this is TypedMacro<Category, Type>;
	public isType(...types: MacroType[]): boolean {
		return types.includes(this.type);
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
		if (Macro.isUncategorized(category)) {
			return undefined;
		}
		return stringOrUndefined(category) as Category;
	}

	public static getType(value: Optional<string>): MacroType {
		if (value) {
			if (parseDialogContent(value)) {
				return "dialog";
			}
			if (isUrl(unwrap(value, "[]"))) {
				return "tableUrl";
			}
			if (parseTable(value)) {
				return "table";
			}
			if (isRandomItem(value) && !matchesBasicDice(value)) {
				return "items";
			}
			if (isMath(value)) {
				return "math";
			}
		}
		return "dice";
	}

	public static isUncategorized(value?: string): value is Uncategorized {
		return value === Uncategorized;
	}

	public static async validateMacro(macro: MacroBase | Macro): Promise<boolean> {
		const type = "type" in macro ? macro.type : Macro.getType(macro.dice);
		switch(type) {
			case "dialog":
				return macro.dialog ? parseDialogContent(macro.dialog) !== undefined : false;
			case "dice":
				return macro.dice ? matchesBasicDice(macro.dice) : false;
			case "items":
				return macro.dice ? isRandomItem(macro.dice) && !matchesBasicDice(macro.dice) : false;
			case "math":
				return macro.dice ? isMath(macro.dice) : false;
			case "table":
				return (await isValidTable(macro.dice)) === "table";
			case "tableUrl":
				return (await isValidTable(macro.dice)) === "url";
			default:
				return false;
		}
	}
}