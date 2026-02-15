
// export type MacroType = "dialog" | "dice" | "items" | "math" | "table" | "tableUrl";

export type MacroBase<Category extends string = string> = {
	/** the name of the macro */
	name: string;
	/** optional category for the macro */
	category?: Category;
	/** dialog macro contents */
	dialog?: string;
	/** dice macro contents */
	dice?: string;
};

/** @deprecated Rebrand Alias/DialogMacro as DialogTemplate */
export type DialogMacroBase<Category extends string = string> = {
	/** the name of the macro */
	name: string;
	/** optional category for the macro */
	category?: Category;
	/** dialog macro contents */
	dialog: string;
	/** dice macro contents */
	dice?: never;
};

export type DiceMacroBase<Category extends string = string> = {
	/** the name of the macro */
	name: string;
	/** optional category for the macro */
	category?: Category;
	/** dialog macro contents */
	dialog?: never;
	/** dice macro contents */
	dice: string;
};