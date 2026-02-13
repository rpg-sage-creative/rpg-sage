import type { MacroBase } from "../../types/index.js";
import { tagFailure } from "../utils/tagFailure.js";
import { isSimpleObject, isValidString } from "./index.js";

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
