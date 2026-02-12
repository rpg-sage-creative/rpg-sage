import { tagFailure } from "../utils/tagFailure.js";
import { isSimpleObject, isValidString } from "./index.js";

export type MacroBase<Category extends string = string> = {
	category?: Category;
	dice?: string;
	dialog?: string;
	name: string;
};

export function isMacroBase(macro: unknown): macro is MacroBase {
	if ((macro as any)?.dialog) tagFailure("warn")`macro with dialog: ${macro}`;
	return isSimpleObject(macro)
		&& isValidString(macro.name)
		&& (isValidString(macro.category) || !("category" in macro))
		&& (
			(isValidString(macro.dice) && !("dialog" in macro))
			||
			(isValidString(macro.dialog) && !("dice" in macro))
		);
}
